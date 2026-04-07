import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .max(254, 'O e-mail deve ter no maximo 254 caracteres.')
  .email('Informe um e-mail valido.')
  .transform((value) => value.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'A senha deve ter no mínimo 8 caracteres.')
  .max(128, 'A senha não pode exceder 128 caracteres.')
  .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
  .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
  .regex(/[0-9]/, 'A senha deve conter pelo menos um número.');

const passwordResetSchema = z.object({
  email: emailSchema,
});

const updatePasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: passwordSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

export function validatePasswordResetEmail(input: { email: string }) {
  const result = passwordResetSchema.safeParse({ email: input.email });
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false as const,
      message: issue?.message ?? 'Informe um e-mail valido.',
    };
  }

  return {
    ok: true as const,
    email: result.data.email,
  };
}

export function validatePassword(input: { password: string; confirmPassword: string }) {
  const result = updatePasswordSchema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    return {
      ok: false as const,
      message: issue?.message ?? 'Informe uma senha válida.',
    };
  }

  return {
    ok: true as const,
    password: result.data.password,
  };
}
