import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { evaluateRules, profileCompleteness } from '../../shared/eligibility.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const hypothetical = body && typeof body.hypotheticalProfile === 'object' && body.hypotheticalProfile !== null
      ? body.hypotheticalProfile
      : null;

    let profile = hypothetical;
    if (!profile) {
      const profiles = await base44.entities.UserProfile.filter({}, { sort: '-updated_date', limit: 1 });
      profile = (profiles.items && profiles.items[0]) || {};
    }

    const requestedIds = Array.isArray(body?.opportunityIds) ? body.opportunityIds.slice(0, 100) : [];
    const opportunitiesPage = requestedIds.length > 0
      ? await base44.entities.Opportunity.filter({ id: { $in: requestedIds } }, { limit: 100 })
      : await base44.entities.Opportunity.filter(
          { status: { $in: ['published', 'closing_soon', 'needs_verification'] } },
          { sort: 'title', limit: 100 }
        );
    const opportunities = opportunitiesPage.items || [];

    if (opportunities.length === 0) {
      return Response.json({
        results: [],
        profile_completeness: profileCompleteness(profile),
        hypothetical: Boolean(hypothetical)
      });
    }

    const rulesPage = await base44.entities.EligibilityRule.filter(
      { opportunity_id: { $in: opportunities.map((opportunity) => opportunity.id) } },
      { limit: 500 }
    );
    const rules = rulesPage.items || [];

    const results = opportunities.map((opportunity) => {
      const evaluation = evaluateRules(profile, rules.filter((rule) => rule.opportunity_id === opportunity.id));
      return {
        opportunity_id: opportunity.id,
        title: opportunity.title,
        category: opportunity.category,
        status: opportunity.status,
        short_description: opportunity.short_description,
        authority: opportunity.authority,
        region: opportunity.region,
        state: opportunity.state,
        education_level: opportunity.education_level,
        application_deadline: opportunity.application_deadline || null,
        source_verified: opportunity.source_verified === true,
        verdict: evaluation.status,
        summary: evaluation.summary,
        counts: evaluation.counts,
        evaluations: evaluation.evaluations
      };
    });

    return Response.json({
      results,
      profile_completeness: profileCompleteness(profile),
      hypothetical: Boolean(hypothetical)
    });
  } catch (error) {
    const message = String(error?.message || '');
    if (/rate limit/i.test(message)) {
      return Response.json({ error: 'rate_limited', message: 'Too many requests right now — retry in a moment.' }, { status: 429 });
    }
    return Response.json({ error: message }, { status: 500 });
  }
}