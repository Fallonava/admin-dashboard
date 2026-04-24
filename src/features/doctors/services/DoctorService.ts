import { prisma } from '@/lib/prisma';
import { notifyDoctorUpdates, notifyViaSocket, syncAdminData } from '@/lib/automation-broadcaster';
import { getFullSnapshot } from '@/lib/data-fetchers';

export class DoctorService {
  /**
   * Mengambil daftar dokter dengan paginasi
   */
  static async getDoctors(page: number = 1, limit: number = 100) {
    const skip = (page - 1) * limit;

    const [doctors, total] = await Promise.all([
      prisma.doctor.findMany({
        skip,
        take: limit,
        orderBy: [
          { order: 'asc' },
          { specialty: 'asc' },
          { name: 'asc' }
        ]
      }),
      prisma.doctor.count()
    ]);

    const shifts = await prisma.shift.findMany();

    // Calculate Today's Index using WIB timezone
    const now = new Date();
    const wibNow = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const jsDay = wibNow.getUTCDay();
    const todayIdx = (jsDay + 6) % 7;

    const enhancedDoctors = doctors.map(doc => {
      const todayShift = shifts.find(s => s.doctorId === doc.id && s.dayIdx === todayIdx);
      return {
        ...doc,
        lastManualOverride: doc.lastManualOverride ? Number(doc.lastManualOverride) : undefined,
        currentRegistrationTime: todayShift?.registrationTime || doc.registrationTime
      };
    });

    return { data: enhancedDoctors, total };
  }

  /**
   * Reset status semua dokter
   */
  static async resetAllDoctors() {
    await prisma.doctor.updateMany({
      data: {
        status: 'LIBUR',
        queueCode: '',
        lastCall: null,
        registrationTime: null,
        lastManualOverride: null
      }
    });

    const docs = await prisma.doctor.findMany({ select: { id: true } });
    const ids = docs.map(d => String(d.id));
    
    notifyDoctorUpdates(ids.map(id => ({ id })));
    notifyViaSocket('doctor_updated', { ids });
    getFullSnapshot().then(syncAdminData).catch(console.error);
    
    return true;
  }

  /**
   * Update massal dokter
   */
  static async bulkUpdate(updates: any[]) {
    const results = await prisma.$transaction(
      updates.map((update) => {
        const { id, ...data } = update;
        return prisma.doctor.update({
          where: { id },
          data: data as any
        });
      })
    );

    const ids = updates.map(u => String(u.id));
    notifyDoctorUpdates(ids.map(id => ({ id })));
    notifyViaSocket('doctor_updated', { ids });
    getFullSnapshot().then(syncAdminData).catch(console.error);

    return results;
  }

  /**
   * Reorder dokter
   */
  static async reorder(items: { id: string; order: number }[]) {
    await prisma.$transaction(
      items.map((item) => 
        prisma.doctor.update({
          where: { id: item.id },
          data: { order: item.order }
        })
      )
    );
    return true;
  }

  /**
   * Buat dokter baru
   */
  static async create(data: any) {
    const newDoctor = await prisma.doctor.create({ data });
    return {
      ...newDoctor,
      lastManualOverride: newDoctor.lastManualOverride ? Number(newDoctor.lastManualOverride) : undefined
    };
  }

  /**
   * Update dokter tunggal
   */
  static async update(id: string, data: any) {
    // Ensure lastManualOverride is updated when status is manually changed
    if (data.status && typeof data.lastManualOverride === 'undefined') {
      data.lastManualOverride = Date.now();
    }

    const updated = await prisma.doctor.update({
      where: { id },
      data
    });

    notifyDoctorUpdates([{ id: String(updated.id) }]);
    notifyViaSocket('doctor_updated', { ids: [String(updated.id)] });
    getFullSnapshot().then(syncAdminData).catch(console.error);

    return {
      ...updated,
      lastManualOverride: updated.lastManualOverride ? Number(updated.lastManualOverride) : undefined
    };
  }

  /**
   * Hapus dokter
   */
  static async delete(id: string) {
    await prisma.doctor.delete({ where: { id } });
    
    notifyDoctorUpdates([{ id }]);
    notifyViaSocket('doctor_updated', { ids: [id] });
    notifyViaSocket('schedule_changed', { reason: 'doctor_deleted', ts: Date.now() });
    getFullSnapshot().then(syncAdminData).catch(console.error);
    
    return true;
  }
}
