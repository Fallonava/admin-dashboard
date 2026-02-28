/**
 * Simple heuristics prototype for suggesting automation rules.
 * This is NOT a full ML model — it's a rules-based heuristic that
 * derives low-risk suggestions from existing data (shifts, leaves, settings).
 */


export interface HeuristicRule {
  name: string;
  rationale?: string;
  suggestion: any; // shape compatible with automation rule create
}

export async function suggestRules(prisma: any): Promise<HeuristicRule[]> {
  const suggestions: HeuristicRule[] = [];

  try {
    // Suggestion A: If doctor has no shift for today => set TIDAK PRAKTEK
    suggestions.push({
      name: 'No-shift-becomes-TIDAK_PRAKTEK',
      rationale: 'Doctors without a shift on a day should be marked TIDAK PRAKTEK',
      suggestion: {
        name: 'Auto: No shift → TIDAK PRAKTEK',
        condition: {
          // empty condition means rule will run per doctor/shift logic
        },
        action: { status: 'TIDAK PRAKTEK' },
        active: false
      }
    });

    // Suggestion B: If doctor is on leave today => set CUTI
    suggestions.push({
      name: 'Leave-becomes-CUTI',
      rationale: 'If a leave request matches today, mark doctor CUTI',
      suggestion: {
        name: 'Auto: Leave → CUTI',
        condition: { dateRange: 'today' },
        action: { status: 'CUTI' },
        active: false
      }
    });

    // Suggestion C: If last manual override exists and frequent toggles, suggest manual-exempt rule
    // Find doctors with lastManualOverride present
    if ((prisma as any).doctor) {
      const docs = await prisma.doctor.findMany({ where: { lastManualOverride: { not: null } }, take: 5 });
      if (docs && docs.length > 0) {
        suggestions.push({
          name: 'Respect-manual-overrides',
          rationale: 'Some doctors were manually overridden recently — consider rules that avoid overwriting manual settings',
          suggestion: {
            name: 'Auto: Respect manual overrides',
            condition: { /* engine should skip doctors with lastManualOverride */ },
            action: { /* no-op placeholder */ },
            active: false
          }
        });
      }
    }
  } catch (err) {
    console.warn('heuristics suggest error', err);
  }

  return suggestions;
}
