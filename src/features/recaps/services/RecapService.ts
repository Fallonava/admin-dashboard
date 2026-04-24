import { prisma } from '@/lib/prisma';

export class RecapService {
  static async getRecaps() {
    return prisma.dailyRecap.findMany({ orderBy: { date: 'asc' } });
  }

  static async saveRecap(payload: any) {
    if (!payload || !payload.date) {
      throw new Error('Invalid payload: date is required');
    }

    const existingRecap = await prisma.dailyRecap.findUnique({ where: { date: new Date(payload.date) } });

    if (!existingRecap) {
      const newRecap = await prisma.dailyRecap.create({
        data: {
          date: new Date(payload.date),
          total_patients: payload.total_patients || 0,
          missing_sep_count: payload.missing_sep_count || 0,
          staff_performance: payload.staff_performance || [],
          missing_sep_details: payload.missing_sep_details || [],
        }
      });
      return newRecap;
    }

    // Smart Merge Logic
    const incomingAnomalies: any[] = payload.missing_sep_details || [];
    const incomingRMs = new Set(incomingAnomalies.map((a: any) => a.no_rm));
    const existingDetails = existingRecap.missing_sep_details as any[];

    const mergedAnomalies: any[] = [];

    existingDetails.forEach((existingAnomaly: any) => {
      if (incomingRMs.has(existingAnomaly.no_rm)) {
        const updatedInfo = incomingAnomalies.find((a: any) => a.no_rm === existingAnomaly.no_rm);
        existingAnomaly.nama = updatedInfo.nama;
        existingAnomaly.asuransi = updatedInfo.asuransi;
        mergedAnomalies.push(existingAnomaly);
      } else {
        if (['OPEN', 'PENDING_DOCTOR', 'PENDING_SYSTEM'].includes(existingAnomaly.status)) {
          existingAnomaly.status = 'RESOLVED';
          existingAnomaly.resolvedAt = new Date();
          existingAnomaly.audit_logs.push({
            action: 'System Auto-Resolve',
            note: 'SEP terdeteksi pada hasil unggahan rekap Excel terbaru.',
            by: 'Sistem',
            timestamp: new Date()
          });
        }
        mergedAnomalies.push(existingAnomaly);
      }
    });

    const existingRMs = new Set(existingDetails.map((a: any) => a.no_rm));
    incomingAnomalies.forEach((incomingAnomaly: any) => {
      if (!existingRMs.has(incomingAnomaly.no_rm)) {
        incomingAnomaly.status = 'OPEN';
        incomingAnomaly.audit_logs = [{
          action: 'Detected as Anomaly',
          note: 'Dicatat sebagai Anomali (Missing SEP) saat unggah rekap harian.',
          by: 'Sistem',
          timestamp: new Date()
        }];
        mergedAnomalies.push(incomingAnomaly);
      }
    });

    const newMissingCount = mergedAnomalies.filter(
      (a: any) => !['RESOLVED', 'IGNORED', 'REJECTED'].includes(a.status)
    ).length;

    const savedRecap = await prisma.dailyRecap.update({
      where: { id: existingRecap.id },
      data: {
        total_patients: payload.total_patients,
        staff_performance: payload.staff_performance || [],
        missing_sep_details: mergedAnomalies,
        missing_sep_count: newMissingCount,
      }
    });

    return savedRecap;
  }

  static async deleteRecap(dateString: string) {
    return prisma.dailyRecap.delete({ where: { date: new Date(dateString) } });
  }
}
