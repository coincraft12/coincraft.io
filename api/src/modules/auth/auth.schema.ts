import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해 주세요.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.').regex(/\d/, '비밀번호에 숫자가 포함되어야 합니다.'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.').max(50),
  phone: z.string().regex(/^[0-9]{10,11}$/, '연락처는 숫자 10~11자리로 입력해 주세요.').optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).regex(/\d/),
});

export const resendVerificationSchema = z.object({
  email: z.string().email(),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
