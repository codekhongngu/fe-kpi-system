import { z } from 'zod'

const _userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('invited'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof _userStatusSchema>

const _userSchema = z.object({
  id: z.string(),
  code: z.string(),
  fullName: z.string(),
  username: z.string(),
  email: z.string(),
  orgId: z.string().nullable(),
  roleIds: z.array(z.string()),
  isActive: z.boolean(),
  lastLoginAt: z.string().nullable(),
})
export type User = z.infer<typeof _userSchema>
