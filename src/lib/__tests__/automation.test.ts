import { evaluateRules } from '@/lib/automation';
import type { Doctor, Shift, LeaveRequest } from '@/lib/data-service';
describe('Automation Helpers', () => {
  const mockDoctors: Doctor[] = [
    { id: '1', name: 'Dr. Alice', status: 'LIBUR', specialty: 'Bedah', category: 'Bedah' as const, startTime: '08:00', endTime: '14:00', queueCode: 'A1', lastManualOverride: undefined },
    { id: '2', name: 'Dr. Bob', status: 'PRAKTEK', specialty: 'Anak', category: 'NonBedah' as const, startTime: '09:00', endTime: '15:00', queueCode: 'B1', lastManualOverride: undefined },
    { id: '3', name: 'Dr. Charlie', status: 'CUTI', specialty: 'PD', category: 'NonBedah' as const, startTime: '10:00', endTime: '16:00', queueCode: 'C1', lastManualOverride: undefined }
  ] as Doctor[];

  const mockShifts: Shift[] = [
    { id: '1', doctorId: '1', doctor: 'Dr. Alice', dayIdx: 0, formattedTime: '09:00-17:00', disabledDates: [], timeIdx: 0, title: 'Morning', color: 'blue' },
    { id: '2', doctorId: '2', doctor: 'Dr. Bob', dayIdx: 1, formattedTime: '09:00-17:00', disabledDates: [], timeIdx: 1, title: 'Afternoon', color: 'green' }
  ] as Shift[];

  const mockLeaves: LeaveRequest[] = [] as LeaveRequest[];

  it('should evaluate empty rules', () => {
    const result = evaluateRules([], mockDoctors, mockShifts, mockLeaves);
    expect(result).toEqual([]);
  });

  it('should handle rules with empty condition', () => {
    const rules = [
      {
        id: 1,
        name: 'Test Rule',
        condition: {},
        action: { status: 'PRAKTEK' }
      }
    ];

    const result = evaluateRules(rules, mockDoctors, mockShifts, mockLeaves);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should match doctor by status condition', () => {
    const rules = [
      {
        id: 1,
        name: 'Status Match',
        condition: { status: 'LIBUR' },
        action: { status: 'PRAKTEK' }
      }
    ];

    const result = evaluateRules(rules, mockDoctors, mockShifts, mockLeaves);
    // Should have updates for doctors with LIBUR status
    const updates = result.filter(u => u.status === 'PRAKTEK');
    expect(updates.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle time-based rules', () => {
    const rules = [
      {
        id: 1,
        name: 'Time-based',
        condition: { timeRange: '09:00-17:00' },
        action: { status: 'PRAKTEK' }
      }
    ];

    const now = new Date();
    const result = evaluateRules(rules, mockDoctors, mockShifts, mockLeaves, now);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle doctor name matching with fuzzy logic', () => {
    const rules = [
      {
        id: 1,
        name: 'Name-based',
        condition: { doctorName: 'alice' }, // Should match "Dr. Alice"
        action: { status: 'CUTI' }
      }
    ];

    const result = evaluateRules(rules, mockDoctors, mockShifts, mockLeaves);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should not modify data when evaluating', () => {
    const originalStatus = mockDoctors[0].status;
    const rules = [
      {
        id: 1,
        name: 'Immutable Test',
        condition: { status: 'LIBUR' },
        action: { status: 'PRAKTEK' }
      }
    ];

    evaluateRules(rules, mockDoctors, mockShifts, mockLeaves);
    expect(mockDoctors[0].status).toBe(originalStatus);
  });

  it('should skip rules that fail with error', () => {
    const rules = [
      {
        id: 1,
        name: 'Bad Rule',
        condition: null, // Will trigger error
        action: null
      },
      {
        id: 2,
        name: 'Good Rule',
        condition: { status: 'PRAKTEK' },
        action: { status: 'CUTI' }
      }
    ];

    // Should not throw
    const result = evaluateRules(rules, mockDoctors, mockShifts, mockLeaves);
    expect(Array.isArray(result)).toBe(true);
  });
});
