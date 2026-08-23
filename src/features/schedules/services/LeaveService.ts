import { prisma } from '@/lib/prisma';
import { notifyViaSocket, syncAdminData, triggerSchedulerResync } from '@/lib/automation-broadcaster';
import { getFullSnapshot } from '@/lib/data-fetchers';

export class LeaveService {
  static async resolveDoctor(doctorId?: string | null, doctorName?: string | null) {
    if (doctorId) {
      const doc = await prisma.doctor.findUnique({ where: { id: doctorId } });
      if (doc) return doc;
    }

    if (!doctorName) return null;

    const trimmed = doctorName.trim();
    // 1. Exact match
    let doc = await prisma.doctor.findFirst({ where: { name: trimmed } });
    if (doc) return doc;

    // 2. Case-insensitive substring match
    doc = await prisma.doctor.findFirst({
      where: { name: { contains: trimmed, mode: 'insensitive' } }
    });
    if (doc) return doc;

    // 3. Normalized nickname / token matching
    const allDocs = await prisma.doctor.findMany();
    const cleanTokens = (str: string) =>
      str.toLowerCase()
        .replace(/^(dr|drg|prof|drs)\.?\s+/gi, '')
        .replace(/,\s*(sp\.[a-z]+|m\.kes|mars|subsp\.[a-z]+|ph\.d).*/gi, '')
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2);

    const targetTokens = cleanTokens(trimmed);
    for (const d of allDocs) {
      const docTokens = cleanTokens(d.name);
      const isMatch = targetTokens.some(t =>
        docTokens.some(dt => dt.includes(t) || t.includes(dt))
      );
      if (isMatch) return d;
    }

    return null;
  }

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
    const affectedDoctorIds = new Set<string>();

    const results = await Promise.all(
      dataArray.map(async (item) => {
        const { dates, doctor, doctorId, matchedDoctorId, ...rest } = item;
        const targetId = doctorId || matchedDoctorId;
        const doc = await this.resolveDoctor(targetId, doctor);
        if (!doc) {
          console.warn(`[LeaveService] Could not resolve doctor for item:`, item);
          return null;
        }

        affectedDoctorIds.add(doc.id);

        const sDate = new Date(item.startDate);
        const eDate = new Date(item.endDate);
        const startOfDay = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0, 0);
        const endOfDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999);

        // Find ALL overlapping leaves for this doctor
        const existingLeaves = await prisma.leaveRequest.findMany({
          where: {
            doctorId: doc.id,
            startDate: { lte: endOfDay },
            endDate: { gte: startOfDay },
          },
          orderBy: { startDate: 'desc' }
        });

        if (existingLeaves.length > 0) {
          const primaryLeave = existingLeaves[0];
          // Delete extra duplicates if any exist
          if (existingLeaves.length > 1) {
            const extraIds = existingLeaves.slice(1).map(l => l.id);
            await prisma.leaveRequest.deleteMany({
              where: { id: { in: extraIds } }
            });
          }

          // Update primary leave with latest data
          return prisma.leaveRequest.update({
            where: { id: primaryLeave.id },
            data: {
              ...rest,
              type: (item.type || primaryLeave.type || 'Liburan') as any,
              status: 'Approved',
              startDate: sDate,
              endDate: eDate,
              reason: item.reason || primaryLeave.reason,
            }
          });
        }

        return prisma.leaveRequest.create({
          data: {
            ...rest,
            type: (item.type || 'Liburan') as any,
            doctorId: doc.id,
            status: 'Approved',
            startDate: sDate,
            endDate: eDate,
          }
        });
      })
    );

    if (affectedDoctorIds.size > 0) {
      notifyViaSocket('doctor_updated', { ids: Array.from(affectedDoctorIds) });
    }
    
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return results.filter(Boolean);
  }

  static async create(data: any) {
    const { dates, doctor, doctorId, matchedDoctorId, ...rest } = data;
    const targetId = doctorId || matchedDoctorId;
    const doc = await this.resolveDoctor(targetId, doctor);
    if (!doc) throw new Error('Doctor not found');

    const sDate = new Date(data.startDate);
    const eDate = new Date(data.endDate);
    const startOfDay = new Date(sDate.getFullYear(), sDate.getMonth(), sDate.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(eDate.getFullYear(), eDate.getMonth(), eDate.getDate(), 23, 59, 59, 999);

    // Find ALL overlapping leaves for this doctor
    const existingLeaves = await prisma.leaveRequest.findMany({
      where: {
        doctorId: doc.id,
        startDate: { lte: endOfDay },
        endDate: { gte: startOfDay },
      },
      orderBy: { startDate: 'desc' }
    });

    let resultLeave;
    if (existingLeaves.length > 0) {
      const primaryLeave = existingLeaves[0];
      if (existingLeaves.length > 1) {
        const extraIds = existingLeaves.slice(1).map(l => l.id);
        await prisma.leaveRequest.deleteMany({
          where: { id: { in: extraIds } }
        });
      }

      resultLeave = await prisma.leaveRequest.update({
        where: { id: primaryLeave.id },
        data: {
          ...rest,
          type: (data.type || primaryLeave.type || 'Liburan') as any,
          status: 'Approved',
          startDate: sDate,
          endDate: eDate,
          reason: data.reason || primaryLeave.reason,
        }
      });
    } else {
      resultLeave = await prisma.leaveRequest.create({
        data: {
          ...rest,
          type: (data.type || 'Liburan') as any,
          doctorId: doc.id,
          status: 'Approved',
          startDate: sDate,
          endDate: eDate,
        }
      });
    }

    notifyViaSocket('leave_updated', { id: resultLeave.id });
    notifyViaSocket('doctor_updated', { ids: [doc.id] });
    getFullSnapshot().then(syncAdminData).catch(console.error);
    triggerSchedulerResync();

    return resultLeave;
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
    try {
      const leave = await (prisma.leaveRequest as any).findUnique({
        where: { id }
      });
      if (!leave) return false;

      await (prisma.leaveRequest as any).delete({
        where: { id }
      });
      
      notifyViaSocket('leave_updated', { id });
      if (leave.doctorId) {
        notifyViaSocket('doctor_updated', { ids: [leave.doctorId] });
      }
      getFullSnapshot().then(syncAdminData).catch(console.error);
      triggerSchedulerResync();

      return true;
    } catch (err) {
      console.error("LeaveService.delete error:", err);
      throw err;
    }
  }

  static async deduplicateAll() {
    const allLeaves = await prisma.leaveRequest.findMany({
      orderBy: [{ doctorId: 'asc' }, { startDate: 'asc' }]
    });

    let removedCount = 0;
    const seen = new Map<string, string>(); // doctorId_dateKey -> id

    for (const leave of allLeaves) {
      const s = new Date(leave.startDate);
      const sKey = `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`;
      const uniqueKey = `${leave.doctorId}_${sKey}`;

      if (seen.has(uniqueKey)) {
        await prisma.leaveRequest.delete({ where: { id: leave.id } });
        removedCount++;
      } else {
        seen.set(uniqueKey, leave.id);
      }
    }

    if (removedCount > 0) {
      getFullSnapshot().then(syncAdminData).catch(console.error);
      triggerSchedulerResync();
    }

    return { removedCount, totalRemaining: seen.size };
  }
}
