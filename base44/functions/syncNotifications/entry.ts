import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { computeReadiness } from '../../shared/readiness.ts';
import { activeEdges } from '../../shared/graph.ts';

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const opportunityId = body?.opportunityId;
    if (!opportunityId) return Response.json({ error: 'opportunityId is required' }, { status: 400 });

    const hypotheticalProfile = body?.hypotheticalProfile && typeof body.hypotheticalProfile === 'object'
      ? body.hypotheticalProfile
      : null;
    const hypotheticalDocuments = Array.isArray(body?.hypotheticalDocuments) ? body.hypotheticalDocuments : null;

    const [opportunity, rulesPage, typesPage, edgesPage, settingsPage] = await Promise.all([
      base44.entities.Opportunity.get(opportunityId),
      base44.entities.EligibilityRule.filter({ opportunity_id: opportunityId }, { limit: 200 }),
      base44.entities.DocumentType.list({ limit: 200 }),
      base44.entities.DependencyEdge.list({ limit: 300 }),
      base44.entities.ScoringSettings.list({ sort: '-updated_date', limit: 1 })
    ]);

    let profile = hypotheticalProfile;
    let documents = hypotheticalDocuments;
    if (!profile) {
      const profiles = await base44.entities.UserProfile.filter({}, { sort: '-updated_date', limit: 1 });
      profile = (profiles.items && profiles.items[0]) || {};
    }
    if (!documents) {
      const docsPage = await base44.entities.UserDocument.list({ limit: 200 });
      documents = docsPage.items || [];
    }

    const settings = (settingsPage.items && settingsPage.items[0]) || null;
    const rules = rulesPage.items || [];
    const documentTypes = typesPage.items || [];
    const edges = activeEdges(edgesPage.items || []);

    const result = computeReadiness({
      profile,
      rules,
      requiredDocCodes: opportunity.required_documents || [],
      documents,
      documentTypes,
      edges,
      settings
    });

    const simulated = Boolean(hypotheticalProfile || hypotheticalDocuments);
    let lastRecalculated = null;

    if (!simulated) {
      const snapshots = await base44.entities.ReadinessSnapshot.list({ sort: '-created_date', limit: 1 });
      const latest = snapshots.items && snapshots.items[0];
      const payload = {
        overall_score: result.overall_score,
        eligibility_points: result.points.eligibility,
        document_points: result.points.document,
        dependency_points: result.points.dependency,
        profile_points: result.points.profile,
        status_label: result.status_label,
        eligibility_status: result.eligibility.status,
        blocker_count: result.dependency.roots.length + result.dependency.blocked.length
      };
      if (latest && latest.created_date && latest.created_date.slice(0, 10) === today()) {
        await base44.entities.ReadinessSnapshot.update(latest.id, payload);
        lastRecalculated = latest.created_date;
      } else {
        const created = await base44.entities.ReadinessSnapshot.create(payload);
        lastRecalculated = created.created_date;
      }
    }

    return Response.json({
      opportunity: {
        id: opportunity.id,
        title: opportunity.title,
        category: opportunity.category,
        status: opportunity.status,
        application_deadline: opportunity.application_deadline || null,
        official_application_url: opportunity.official_application_url || null,
        source_verified: opportunity.source_verified === true
      },
      simulated,
      last_recalculated: lastRecalculated,
      readiness: result
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (/rate limit/i.test(message)) {
      return Response.json({ error: 'rate_limited', message: 'Too many requests right now — retry in a moment.' }, { status: 429 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}