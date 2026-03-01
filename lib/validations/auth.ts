import { z } from 'zod'

/** Schema for the login (connexion) form */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\u2019adresse e-mail est requise')
    .email('Adresse e-mail invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

/** Schema for the signup (inscription) form */
export const signupSchema = z
  .object({
    email: z
      .string()
      .min(1, 'L\u2019adresse e-mail est requise')
      .email('Adresse e-mail invalide'),
    password: z
      .string()
      .min(1, 'Le mot de passe est requis')
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z
      .string()
      .min(1, 'La confirmation du mot de passe est requise'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type LoginFormData = z.infer<typeof loginSchema>
export type SignupFormData = z.infer<typeof signupSchema>
