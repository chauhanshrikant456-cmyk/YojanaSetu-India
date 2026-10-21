import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { activeEdges, findCycle } from '../../shared/graph.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const fromCode = body?.from_code;
    const toCode = body?.to_code;
    if (!fromCode || !toCode) {
      return Response.json({ error: 'from_code and to_code are required' }, { status: 400 });
    }
    if (fromCode === toCode) {
      return Response.json({ valid: false, reason: 'A document cannot be its own prerequisite.', cycle: [fromCode, toCode] });
    }

    const [typesPage, edgesPage] = await Promise.all([
      base44.entities.DocumentType.list({ limit: 200 }),
      base44.entities.DependencyEdge.list({ limit: 300 })
    ]);

    const types = typesPage.items || [];
    const codes = types.map((type) => type.code).filter(Boolean);
    if (!codes.includes(fromCode) || !codes.includes(toCode)) {
      return Response.json({ valid: false, reason: 'Both documents must exist in the document catalog first.', cycle: null });
    }

    const existing = activeEdges(edgesPage.items || []);
    const duplicate = existing.some((edge) => edge.from_code === fromCode && edge.to_code === toCode);
    if (duplicate) {
      return Response.json({ valid: false, reason: 'This prerequisite already exists.', cycle: null });
    }

    const candidate = existing.concat([{ from_code: fromCode, to_code: toCode }]);
    const cycle = findCycle(codes, candidate);

    if (cycle) {
      const path = cycle.map((code) => {
        const match = types.find((type) => type.code === code);
        return match ? match.name : code;
      });
      return Response.json({
        valid: false,
        reason: 'This link would create a circular dependency: ' + path.join(' → '),
        cycle: path
      });
    }

    return Response.json({ valid: true, cycle: null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}