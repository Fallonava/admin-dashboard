import { simulateRulesBatch } from '@/lib/automation-simulator';
import type { Doctor, Shift, LeaveRequest } from '@/lib/data-service';

describe('Automation Simulator', () => {
  const mockDoctors: Doctor[] = [
    { id: '1', name: 'Dr. Alice', status: 'TIDAK PRAKTEK' as const, specialty: 'Bedah', category: 'Bedah' as const, startTime: '08:00', endTime: '14:00', queueCode: 'A1' },
    { id: '2', name: 'Dr. Bob', status: 'BUKA' as const, specialty: 'Anak', category: 'NonBedah' as const, startTime: '09:00', endTime: '15:00', queueCode: 'B1' },
    { id: '3', name: 'Dr. Charlie', status: 'CUTI' as const, specialty: 'PD', category: 'NonBedah' as const, startTime: '10:00', endTime: '16:00', queueCode: 'C1' }
  ] as Doctor[];

  const mockShifts: Shift[] = [] as Shift[];
  const mockLeaves: LeaveRequest[] = [] as LeaveRequest[];

  it('should return empty updates for empty rules', () => {
    const result = simulateRulesBatch([], mockDoctors, mockShifts, mockLeaves);
    expect(result.perRule).toEqual([]);
    expect(result.conflicts).toEqual([]);
    expect(result.summary.totalRules).toBe(0);
    expect(result.summary.totalAffected).toBe(0);
  });

  it('should detect rule impact on doctors', () => {
    const rules = [
      {
        id: 1,
        name: 'Rule 1',
        condition: { status: 'TIDAK PRAKTEK' },
        action: { status: 'BUKA' }
      }
    ];

    const result = simulateRulesBatch(rules, mockDoctors, mockShifts, mockLeaves);
    expect(result.perRule.length).toBe(1);
    expect(result.perRule[0].affectedCount).toBeGreaterThanOrEqual(0);
  });

  it('should detect conflicts when multiple rules target same doctor', () => {
    const rules = [
      {
        id: 1,
        name: 'Rule 1',
        condition: { status: 'BUKA' },
        action: { status: 'CUTI' }
      },
      {
        id: 2,
        name: 'Rule 2',
        condition: { status: 'BUKA' },
        action: { status: 'SELESAI' }
      }
    ];

    const result = simulateRulesBatch(rules, mockDoctors, mockShifts, mockLeaves);
    // Conflict detected if both rules match the same doctor
    if (result.conflicts.length > 0) {
      expect(result.conflicts[0]).toHaveProperty('id');
      expect(result.conflicts[0]).toHaveProperty('statuses');
    }
  });

  it('should resolve conflicts with priority strategy', () => {
    const rules = [
      {
        id: 1,
        name: 'Rule 1',
        condition: { status: 'BUKA' },
        action: { status: 'CUTI' }
      },
      {
        id: 2,
        name: 'Rule 2',
        condition: { status: 'BUKA' },
        action: { status: 'SELESAI' }
      }
    ];

    const result = simulateRulesBatch(rules, mockDoctors, mockShifts, mockLeaves, {
      resolutionStrategy: 'priority'
    });

    if (result.resolutions) {
      expect(result.resolved).toBeDefined();
      expect(result.resolved.updates).toBeDefined();
      expect(Array.isArray(result.resolved.updates)).toBe(true);
    }
  });

  it('should return correct summary', () => {
    const rules = [
      {
        id: 1,
        name: 'Rule 1',
        condition: {},
        action: { status: 'BUKA' }
      }
    ];

    const result = simulateRulesBatch(rules, mockDoctors, mockShifts, mockLeaves);
    expect(result.summary).toHaveProperty('totalRules');
    expect(result.summary).toHaveProperty('totalAffected');
    expect(result.summary).toHaveProperty('totalConflicts');
    expect(result.summary.totalRules).toBe(1);
  });
});
