import { z } from 'zod';

// --- USERS ---
export const UserCreateSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
  roleId: z.string().nullable().optional(),
});

export const UserUpdateSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(3).max(50).optional(),
  password: z.string().min(6).optional(),
  name: z.string().min(1).max(100).optional(),
  roleId: z.string().nullable().optional(),
});

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
export type UserUpdateDTO = z.infer<typeof UserUpdateSchema>;

// --- ROLES ---
export const RolePermissionSchema = z.object({
  resource: z.string().min(1),
  action: z.string().min(1),
});

export const RoleCreateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().nullable().optional(),
  permissions: z.array(RolePermissionSchema).optional().default([]),
});

export const RoleUpdateSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  description: z.string().nullable().optional(),
  permissions: z.array(RolePermissionSchema).optional().default([]),
});

export type RoleCreateDTO = z.infer<typeof RoleCreateSchema>;
export type RoleUpdateDTO = z.infer<typeof RoleUpdateSchema>;
