import { prisma } from '@/lib/prisma';
import { notifyViaSocket, syncAdminData, triggerSchedulerResync } from '@/lib/automation-broadcaster';
import { getFullSnapshot } from '@/lib/data-fetchers';

export class ShiftService {
  static async getShifts(dayIdx: number | null, filterDate: Date | null, includeLeaves: boolean) {
    const whereClause: any = { doctorId: { not: "" } };
    if (dayIdx !== null && !isNaN(dayIdx)) {
      whereClause.dayIdx = dayIdx;
    }

    const shifts = await prisma.shift.findMany({
      where: whereClause,
      include: { 
        doctor: {
          include: {
            ...((includeLeaves || filterDate) ? { leaveRequests: true } : {})
          }
        } 
      },
      orderBy: [{ dayIdx: 'asc' }, { timeIdx: 'asc' }]
    });

    let mappedShifts = shifts.filter(s => s.doctor !== null).map((s: any) => {
      const doctorRel = s.doctor ? { ...s.doctor } : null;
      if (doctorRel && typeof doctorRel.lastManualOverride === 'bigint') {
        doctorRel.lastManualOverride = Number(doctorRel.lastManualOverride);
      }
      return {
        ...s,
        doctor: s.doctor?.name || 'Unknown',
        doctorName: s.doctor?.name || 'Unknown',
        doctorRel: doctorRel
      };
    });

    if (filterDate && !isNaN(filterDate.getTime())) {
      mappedShifts = mappedShifts.filter((s: any) => {
        if (s.doctorRel && s.doctorRel.leaveRequests) {
          const isOnLeave = s.doctorRel.leaveRequests.some((lr: any) => {
            const statusStr = (lr.status || '').toLowerCase();
            if (statusStr === 'rejected' || statusStr === 'ditolak') return false;
            
            const start = new Date(lr.startDate);
            const end = new Date(lr.endDate);
            const check = new Date(filterDate);
            check.setHours(0, 0, 0, 0);
            start.setHours(0, 0, 0, 0);
            end.setHours(0, 0, 0, 0);
            return check >= start && check <= end;
          });
          return !isOnLeave;
        }
        return true;
      });
    }

    return mappedShifts;
  }

  static async create(data: any) {
    const newShift = await prisma.shift.create({ data });
    notifyViaSocket('shift_updated', { id: newShift.id });
    notifyViaSocket('doctor_updated', { ids: [newShift.doctorId] });

    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return newShift;
  }

  static async update(id: string, updates: any) {
    const updated = await prisma.shift.update({
      where: { id },
      data: updates
    });
    notifyViaSocket('shift_updated', { id });
    if (updated.doctorId) {
      notifyViaSocket('doctor_updated', { ids: [updated.doctorId] });
    }

    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return updated;
  }

  static async delete(id: string) {
    const deleted = await prisma.shift.delete({
      where: { id }
    });
    notifyViaSocket('shift_updated', { id });
    if (deleted && deleted.doctorId) {
      notifyViaSocket('doctor_updated', { ids: [deleted.doctorId] });
    }

    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return true;
  }
}
