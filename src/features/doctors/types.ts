import { z } from 'zod';

export const DoctorStatusEnum = z.enum([
  'TERJADWAL', 'PENDAFTARAN', 'PRAKTEK', 'PENUH', 
  'OPERASI', 'CUTI', 'SELESAI', 'LIBUR'
]);

export const BulkUpdateSchema = z.array(
  z.object({
      id: z.union([z.string(), z.number()]).transform(String),
      status: DoctorStatusEnum.optional(),
  }).strict()
);

export const CreateDoctorSchema = z.object({
  name: z.string().min(1).max(255),
  specialty: z.string().min(1).max(255),
  status: z.any(),
  category: z.enum(['Bedah', 'NonBedah']),
  startTime: z.string().optional().default("00:00"),
  endTime: z.string().optional().default("00:00"),
  queueCode: z.string().optional(),
  lastCall: z.string().nullable().optional(),
  registrationTime: z.string().nullable().optional(),
  lastManualOverride: z.number().optional(),
});

export const UpdateDoctorSchema = CreateDoctorSchema.partial().extend({
  id: z.string(),
});

export type CreateDoctorDTO = z.infer<typeof CreateDoctorSchema>;
export type UpdateDoctorDTO = z.infer<typeof UpdateDoctorSchema>;
export type BulkUpdateDTO = z.infer<typeof BulkUpdateSchema>;
