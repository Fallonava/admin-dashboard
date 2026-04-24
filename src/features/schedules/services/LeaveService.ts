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
    const newLeaves = await Promise.all(
      dataArray.map(async (item) => {
        const { dates, doctor, ...rest } = item;
        const doc = await prisma.doctor.findFirst({ where: { name: doctor } });
        if (!doc) return;
        return prisma.leaveRequest.create({
          data: {
            ...rest,
            type: item.type as any,
            doctorId: doc.id,
            status: 'Approved',
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate)
          }
        });
      })
    );
    
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return newLeaves.filter(Boolean);
  }

  static async create(data: any) {
    const { dates, doctor, ...rest } = data;
    const doc = await prisma.doctor.findFirst({ where: { name: doctor } });
    if (!doc) throw new Error('Doctor not found');

    const newLeave = await prisma.leaveRequest.create({
      data: {
        ...rest,
        type: data.type as any,
        doctorId: doc.id,
        status: 'Approved',
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate)
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
