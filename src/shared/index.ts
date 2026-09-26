import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1).max(100).optional(),
});
export type RegisterDto = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
export type LoginDto = z.infer<typeof LoginSchema>;

export const VerifyEmailSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
});
export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;

export const VerifyLoginSchema = z.object({
  email: z.string().email('Invalid email'),
  code: z.string().length(6, 'Code must be 6 digits'),
});
export type VerifyLoginDto = z.infer<typeof VerifyLoginSchema>;

export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  emailVerified: z.boolean(),
  createdAt: z.union([z.string(), z.date()]),
  updatedAt: z.union([z.string(), z.date()]),
});
export type UserPublic = z.infer<typeof UserPublicSchema>;

export const AuthResponseSchema = z.object({
  accessToken: z.string(),
  user: UserPublicSchema,
  devCode: z.string().optional(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const LoginChallengeResponseSchema = z.object({
  requiresEmailVerification: z.literal(true),
  email: z.string().email(),
  message: z.string(),
  devCode: z.string().optional(),
});
export type LoginChallengeResponse = z.infer<
  typeof LoginChallengeResponseSchema
>;

export const MeResponseSchema = z.object({
  user: UserPublicSchema,
});
export type MeResponse = z.infer<typeof MeResponseSchema>;

export const MessageResponseSchema = z.object({
  message: z.string(),
  user: UserPublicSchema.optional(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt?: string;
};

export type WorkspaceMember = {
  userId: string;
  displayName?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'invited' | 'revoked';
  invitedAt?: string;
};

export type UiNodeType =
  | 'stack'
  | 'card'
  | 'text'
  | 'list'
  | 'listItem'
  | 'nav'
  | 'navItem';

export type UiNode = {
  type: UiNodeType;
  props?: Record<string, string | number | boolean>;
  children?: UiNode[];
};
