import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Informe seu e-mail.')
  .max(254, 'O e-mail deve ter no maximo 254 caracteres.')
  .email('Informe um e-mail valido.')
  .transform((value) => value.toLowerCase());

const passwordResetSchema = z.object({
  email: emailSchema,
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
