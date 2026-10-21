import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { activeEdges, analyzeGaps, findCycle, layering } from '../../shared/graph.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const heldCodes = Array.isArray(body?.heldDocumentCodes) ? body.heldDocumentCodes : null;

    const [typesPage, edgesPage, docsPage, opportunitiesPage] = await Promise.all([
      base44.entities.DocumentType.list({ limit: 200 }),
      base44.entities.DependencyEdge.list({ limit: 300 }),
      heldCodes ? Promise.resolve({ items: [] }) : base44.entities.UserDocument.list({ limit: 200 }),
      base44.entities.Opportunity.filter(
        { status: { $in: ['published', 'closing_soon', 'needs_verification'] } },
        { limit: 100 }
      )
    ]);

    const types = typesPage.items || [];
    const edges = activeEdges(edgesPage.items || []);
    const documents = docsPage.items || [];
    const opportunities = opportunitiesPage.items || [];

    const codes = types.map((type) => type.code);
    const edgesWithUnknown = edges.filter((edge) => codes.includes(edge.from_code) && codes.includes(edge.to_code));
    const { levels, cyclic, remaining } = layering(codes, edgesWithUnknown);
    const cycle = findCycle(codes, edgesWithUnknown);

    const held = heldCodes
      ? new Set(heldCodes)
      : new Set(documents.filter((doc) => ['uploaded', 'pending_verification', 'verified'].includes(doc.status)).map((doc) => doc.document_code));
    const unresolved = new Set(codes.filter((code) => !held.has(code)));

    const gaps = analyzeGaps(codes, edgesWithUnknown, unresolved);

    const requiredAcrossAll = [...new Set(opportunities.flatMap((opportunity) => opportunity.required_documents || []))];
    const unblocked = opportunities.filter((opportunity) => {
      const needed = opportunity.required_documents || [];
      if (needed.length === 0) return false;
      return needed.every((code) => held.has(code));
    });
    const blockedOpportunities = opportunities.filter((opportunity) => {
      const needed = opportunity.required_documents || [];
      return needed.some((code) => !held.has(code));
    });

    return Response.json({
      nodes: types.map((type) => {
        const dependents = edgesWithUnknown.filter((edge) => edge.from_code === type.code).map((edge) => edge.to_code);
        const prerequisites = edgesWithUnknown.filter((edge) => edge.to_code === type.code).map((edge) => edge.from_code);
        return {
          code: type.code,
          name: type.name,
          held: held.has(type.code),
          prerequisites,
          dependents,
          blocked: !held.has(type.code) && prerequisites.some((code) => !held.has(code))
        };
      }),
      edges: edgesWithUnknown.map((edge) => ({
        from_code: edge.from_code,
        to_code: edge.to_code,
        from_name: typeName(types, edge.from_code),
        to_name: typeName(types, edge.to_code),
        description: edge.description || null,
        id: edge.id
      })),
      levels,
      cycle,
      cyclic,
      remaining,
      root_blockers: gaps.roots.map((code) => ({ code, name: typeName(types, code) })),
      blocked_documents: gaps.blocked.map((code) => ({ code, name: typeName(types, code) })),
      sequence: gaps.sequence.map((code) => ({ code, name: typeName(types, code) })),
      unresolved_required: requiredAcrossAll.filter((code) => !held.has(code)).map((code) => ({ code, name: typeName(types, code) })),
      unblocked_opportunities: unblocked.slice(0, 20).map((opportunity) => ({ id: opportunity.id, title: opportunity.title })),
      blocked_opportunity_count: blockedOpportunities.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function typeName(types, code) {
  const match = (types || []).find((type) => type.code === code);
  return match ? match.name : code;
}