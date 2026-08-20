import { prisma } from '@/lib/prisma';
import { notifyViaSocket, syncAdminData, triggerSchedulerResync } from '@/lib/automation-broadcaster';
import { getFullSnapshot } from '@/lib/data-fetchers';

export class LeaveService {
  static async getLeaves() {
    const leaves = await (prisma.leaveRequest as any).findMany({
      where: { doctorId: { not: "" } },
      include: { doctor: true }
    });

    const mappedLeaves = leaves
      .filter((l: any) => l.doctor !== null)
      .map((l: any) => ({
        ...l,
        doctor: l.doctor?.name || 'Unknown'
      }));

    return mappedLeaves;
  }

  static async createBulk(dataArray: any[]) {
    const results = await Promise.all(
      dataArray.map(async (item) => {
        const { dates, doctor, doctorId, matchedDoctorId, ...rest } = item;
        const targetId = doctorId || matchedDoctorId;
        const doc = targetId 
          ? await prisma.doctor.findUnique({ where: { id: targetId } })
          : await prisma.doctor.findFirst({ where: { name: doctor } });
        if (!doc) return null;

        const sDate = new Date(item.startDate);
        const eDate = new Date(item.endDate);
        const startOfDay = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999);

        // Check if leave already exists for this doctor on overlapping dates
        const existingLeave = await prisma.leaveRequest.findFirst({
          where: {
            doctorId: doc.id,
            startDate: { lte: endOfDay },
            endDate: { gte: startOfDay },
          }
        });

        if (existingLeave) {
          // Update existing to prevent duplicates
          return prisma.leaveRequest.update({
            where: { id: existingLeave.id },
            data: {
              ...rest,
              type: (item.type || existingLeave.type) as any,
              status: 'Approved',
              startDate: sDate,
              endDate: eDate,
              reason: item.reason || existingLeave.reason,
            }
          });
        }

        return prisma.leaveRequest.create({
          data: {
            ...rest,
            type: item.type as any,
            doctorId: doc.id,
            status: 'Approved',
            startDate: sDate,
            endDate: eDate,
          }
        });
      })
    );
    
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return results.filter(Boolean);
  }

  static async create(data: any) {
    const { dates, doctor, doctorId, matchedDoctorId, ...rest } = data;
    const targetId = doctorId || matchedDoctorId;
    const doc = targetId
      ? await prisma.doctor.findUnique({ where: { id: targetId } })
      : await prisma.doctor.findFirst({ where: { name: doctor } });
    if (!doc) throw new Error('Doctor not found');

    const sDate = new Date(data.startDate);
    const eDate = new Date(data.endDate);
    const startOfDay = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999);

    const existingLeave = await prisma.leaveRequest.findFirst({
      where: {
        doctorId: doc.id,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      }
    });

    if (existingLeave) {
      const updatedLeave = await prisma.leaveRequest.update({
        where: { id: existingLeave.id },
        data: {
          ...rest,
          type: (data.type || existingLeave.type) as any,
          status: 'Approved',
          startDate: sDate,
          endDate: eDate,
          reason: data.reason || existingLeave.reason,
        }
      });
      notifyViaSocket('leave_updated', { id: updatedLeave.id });
      notifyViaSocket('doctor_updated', { ids: [doc.id] });
      getFullSnapshot().then(syncAdminData).catch(console.error);
      triggerSchedulerResync();
      return updatedLeave;
    }

    const newLeave = await prisma.leaveRequest.create({
      data: {
        ...rest,
        type: data.type as any,
        doctorId: doc.id,
        status: 'Approved',
        startDate: sDate,
        endDate: eDate,
      }
    });
    
    notifyViaSocket('leave_updated', { id: newLeave.id });
    notifyViaSocket('doctor_updated', { ids: [doc.id] }); 
    
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return newLeave;
  }

  static async update(id: string, updates: any) {
    if (updates.startDate) updates.startDate = new Date(updates.startDate);
    if (updates.endDate) updates.endDate = new Date(updates.endDate);

    const updatedLeave = await (prisma.leaveRequest as any).update({
      where: { id },
      data: updates
    });
    
    notifyViaSocket('leave_updated', { id });
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return updatedLeave;
  }

  static async delete(id: string) {
    await (prisma.leaveRequest as any).delete({
      where: { id }
    });
    
    notifyViaSocket('leave_updated', { id });
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return true;
  }
}
