import { evaluateRules } from './automation';

/**
 * Simulate a batch of rules against provided data and detect conflicts.
 * - rules: array of rule objects (should include .id and .name when available)
 * - doctors, shifts, leaves: arrays fetched from DB
 */
export function simulateRulesBatch(rules: any[], doctors: any[], shifts: any[], leaves: any[], options?: { resolutionStrategy?: 'priority' }) {
  const perRule: Array<{ ruleId: any; name?: string; updates: Array<{ id: string | number; status: string }> ; affectedCount: number }> = [];
  const docMap = new Map<string | number, Set<string>>();
  const docRuleMap = new Map<string | number, Array<{ ruleId: any; status: string }>>();

  for (const rule of rules) {
    try {
      const ruleUpdates = evaluateRules([rule], doctors, shifts, leaves);
      perRule.push({ ruleId: rule.id ?? null, name: rule.name, updates: ruleUpdates, affectedCount: ruleUpdates.length });

      for (const u of ruleUpdates) {
        const key = String(u.id);
        if (!docMap.has(key)) docMap.set(key, new Set());
        docMap.get(key)!.add(u.status);

        if (!docRuleMap.has(key)) docRuleMap.set(key, []);
        docRuleMap.get(key)!.push({ ruleId: rule.id ?? null, status: u.status });
      }
    } catch (e) {
      perRule.push({ ruleId: rule.id ?? null, name: rule.name, updates: [], affectedCount: 0 });
    }
  }

  // Detect conflicts: same doctor targeted by >1 distinct statuses
  const conflicts: Array<{ id: string | number; name?: string; statuses: string[]; rules: Array<{ ruleId: any; status: string }> }> = [];
  for (const [id, statuses] of docMap.entries()) {
    if (statuses.size > 1) {
      conflicts.push({ id, name: undefined, statuses: Array.from(statuses), rules: docRuleMap.get(id) || [] });
    }
  }

  const totalAffected = Array.from(new Set(Array.from(docRuleMap.keys()))).length;

  const result: any = {
    perRule,
    conflicts,
    summary: {
      totalRules: rules.length,
      totalAffected,
      totalConflicts: conflicts.length
    }
  };

  // Optional: generate resolved outcome according to simple strategies
  if (options && options.resolutionStrategy === 'priority') {
    // priority: choose the rule which affects the most doctors (perRule.affectedCount)
    const rulePriority = new Map<any, number>();
    for (const r of perRule) {
      rulePriority.set(r.ruleId ?? null, r.affectedCount || 0);
    }

    const resolutions: Array<{ id: string | number; chosenRuleId: any; chosenStatus: string; candidates: Array<{ ruleId: any; status: string }> }> = [];

    for (const c of conflicts) {
      const candidates = c.rules || [];
      // pick candidate with highest priority (affectedCount), fallback to first
      let best = candidates[0];
      let bestScore = -1;
      for (const cand of candidates) {
        const score = rulePriority.get(cand.ruleId ?? null) ?? 0;
        if (score > bestScore) {
          best = cand;
          bestScore = score;
        }
      }
      resolutions.push({ id: c.id, chosenRuleId: best.ruleId, chosenStatus: best.status, candidates });
    }

    // Build resolved updates: start from perRule updates, but for conflicted ids keep only chosen status
    const resolvedMap = new Map<string | number, { ruleId: any; status: string }>();
    for (const r of perRule) {
      for (const u of r.updates) {
        const key = String(u.id);
        // if this id is in resolutions, check chosen
        const res = resolutions.find(x => String(x.id) === key);
        if (res) {
          if (String(res.chosenRuleId) === String(r.ruleId)) {
            resolvedMap.set(key, { ruleId: res.chosenRuleId, status: u.status });
          }
        } else {
          // no conflict, set/update
          if (!resolvedMap.has(key)) resolvedMap.set(key, { ruleId: r.ruleId, status: u.status });
        }
      }
    }

    const resolvedUpdates = Array.from(resolvedMap.entries()).map(([id, v]) => ({ id, status: v.status, ruleId: v.ruleId }));
    result.resolutions = resolutions;
    result.resolved = {
      updates: resolvedUpdates,
      affected: resolvedUpdates.length
    };
  }

  return result;
}
