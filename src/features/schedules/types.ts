import { z } from 'zod';

// --- SHIFTS ---
export const ShiftCreateSchema = z.object({
    doctorId: z.string().min(1),
    dayIdx: z.number().int().min(0).max(6),
    timeIdx: z.number().int().min(0).optional().default(0),
    title: z.string().min(1),
    color: z.string().min(1),
    formattedTime: z.string().min(1),
    registrationTime: z.string().nullable().optional(),
    extra: z.string().nullable().optional(),
    disabledDates: z.array(z.string()).optional(),
    statusOverride: z.enum(['TERJADWAL', 'PENDAFTARAN', 'PRAKTEK', 'PENUH', 'OPERASI', 'CUTI', 'SELESAI', 'LIBUR']).nullable().optional(),
});

export const ShiftUpdateSchema = ShiftCreateSchema.partial().extend({
    id: z.string().min(1),
});

export type ShiftCreateDTO = z.infer<typeof ShiftCreateSchema>;
export type ShiftUpdateDTO = z.infer<typeof ShiftUpdateSchema>;

// --- LEAVES ---
export const LeaveCreateSchema = z.object({
    doctor: z.string().min(1),
    dates: z.any().optional(),
    specialty: z.string().optional().nullable(),
    type: z.string().min(1),
    startDate: z.union([z.string(), z.date()]),
    endDate: z.union([z.string(), z.date()]),
    reason: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
});

export const LeaveCreateBulkSchema = z.union([LeaveCreateSchema, z.array(LeaveCreateSchema)]);

export const LeaveUpdateSchema = z.object({
    id: z.string().min(1),
    specialty: z.string().optional().nullable(),
    type: z.string().optional(),
    startDate: z.union([z.string(), z.date()]).optional(),
    endDate: z.union([z.string(), z.date()]).optional(),
    reason: z.string().optional().nullable(),
    status: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
});

export type LeaveCreateDTO = z.infer<typeof LeaveCreateSchema>;
export type LeaveUpdateDTO = z.infer<typeof LeaveUpdateSchema>;
