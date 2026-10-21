export function activeEdges(edges) {
  return (edges || []).filter((edge) => edge.is_active !== false && edge.from_code && edge.to_code);
}

export function findCycle(nodes, edges) {
  const adjacency = new Map();
  (nodes || []).forEach((node) => adjacency.set(node, []));
  (edges || []).forEach((edge) => {
    if (!adjacency.has(edge.from_code)) adjacency.set(edge.from_code, []);
    if (!adjacency.has(edge.to_code)) adjacency.set(edge.to_code, []);
    adjacency.get(edge.from_code).push(edge.to_code);
  });

  const state = new Map();
  const stack = [];
  let cycle = null;

  const visit = (node) => {
    if (cycle) return;
    state.set(node, 1);
    stack.push(node);
    for (const next of adjacency.get(node) || []) {
      const status = state.get(next) || 0;
      if (status === 1) {
        cycle = stack.slice(stack.indexOf(next)).concat(next);
        return;
      }
      if (status === 0) {
        visit(next);
        if (cycle) return;
      }
    }
    stack.pop();
    state.set(node, 2);
  };

  (nodes || []).forEach((node) => {
    if ((state.get(node) || 0) === 0 && !cycle) visit(node);
  });

  return cycle;
}

export function layering(nodes, edges) {
  const indegree = new Map();
  const out = new Map();
  (nodes || []).forEach((node) => {
    indegree.set(node, 0);
    out.set(node, []);
  });
  (edges || []).forEach((edge) => {
    if (!indegree.has(edge.from_code)) {
      indegree.set(edge.from_code, 0);
      out.set(edge.from_code, []);
    }
    if (!indegree.has(edge.to_code)) {
      indegree.set(edge.to_code, 0);
      out.set(edge.to_code, []);
    }
    indegree.set(edge.to_code, indegree.get(edge.to_code) + 1);
    out.get(edge.from_code).push(edge.to_code);
  });

  let frontier = [...indegree.keys()].filter((node) => indegree.get(node) === 0).sort();
  const levels = [];
  const seen = new Set();

  while (frontier.length > 0) {
    levels.push(frontier);
    frontier.forEach((node) => seen.add(node));
    const next = [];
    frontier.forEach((node) => {
      (out.get(node) || []).forEach((target) => {
        indegree.set(target, indegree.get(target) - 1);
        if (indegree.get(target) === 0 && !seen.has(target)) next.push(target);
      });
    });
    frontier = [...new Set(next)].sort();
  }

  const remaining = [...indegree.keys()].filter((node) => !seen.has(node));
  return { levels, cyclic: remaining.length > 0, remaining };
}

export function prerequisiteMap(edges) {
  const deps = {};
  activeEdges(edges).forEach((edge) => {
    if (!deps[edge.to_code]) deps[edge.to_code] = [];
    deps[edge.to_code].push(edge.from_code);
  });
  return deps;
}

export function analyzeGaps(requiredCodes, edges, unresolvedSet) {
  const deps = prerequisiteMap(edges);
  const needed = new Set(requiredCodes || []);
  const queue = [...(requiredCodes || [])];

  while (queue.length > 0) {
    const code = queue.shift();
    (deps[code] || []).forEach((prerequisite) => {
      if (!needed.has(prerequisite)) {
        needed.add(prerequisite);
        queue.push(prerequisite);
      }
    });
  }

  const neededList = [...needed];
  const unresolved = neededList.filter((code) => unresolvedSet.has(code));
  const blockedBy = {};
  unresolved.forEach((code) => {
    blockedBy[code] = (deps[code] || []).filter((prerequisite) => unresolvedSet.has(prerequisite));
  });
  const blocked = unresolved.filter((code) => blockedBy[code].length > 0);
  const roots = unresolved.filter((code) => blockedBy[code].length === 0);

  const subEdges = activeEdges(edges).filter((edge) => unresolvedSet.has(edge.from_code) && unresolvedSet.has(edge.to_code));
  const { levels, cyclic } = layering(unresolved, subEdges);

  return {
    needed: neededList,
    unresolved,
    blocked,
    roots,
    blocked_by: blockedBy,
    sequence: levels.flat(),
    cyclic
  };
}