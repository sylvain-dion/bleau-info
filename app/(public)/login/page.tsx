'use client'

import { Suspense, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, AlertCircle, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { loginSchema, signupSchema } from '@/lib/validations/auth'
import type { LoginFormData, SignupFormData } from '@/lib/validations/auth'

type AuthTab = 'login' | 'signup'

/**
 * Login page wrapper with Suspense boundary for useSearchParams().
 * Next.js 15 requires useSearchParams to be wrapped in Suspense
 * to support static generation.
 */
export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const [activeTab, setActiveTab] = useState<AuthTab>('login')
  const [serverError, setServerError] = useState<string | null>(null)
  const [signupSuccess, setSignupSuccess] = useState(false)
  const searchParams = useSearchParams()
  const callbackError = searchParams.get('error')

  return (
    <div className="flex min-h-[calc(100dvh-57px)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Bienvenue sur Bleau.info</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connectez-vous pour accéder à votre carnet de bloc
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {/* OAuth error from callback */}
          {callbackError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>Erreur d&apos;authentification. Veuillez réessayer.</p>
            </div>
          )}

          {/* Signup success message */}
          {signupSuccess && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <p>Un e-mail de confirmation vous a été envoyé. Vérifiez votre boîte de réception.</p>
            </div>
          )}

          {/* Google OAuth */}
          <GoogleSignInButton onError={setServerError} />

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Ou par e-mail</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-4 flex rounded-lg bg-muted p-1">
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'login'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setActiveTab('login')
                setServerError(null)
                setSignupSuccess(false)
              }}
            >
              Connexion
            </button>
            <button
              type="button"
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === 'signup'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => {
                setActiveTab('signup')
                setServerError(null)
                setSignupSuccess(false)
              }}
            >
              Inscription
            </button>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p>{serverError}</p>
            </div>
          )}

          {/* Forms */}
          {activeTab === 'login' ? (
            <LoginForm onError={setServerError} />
          ) : (
            <SignupForm onError={setServerError} onSuccess={() => setSignupSuccess(true)} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Google OAuth Button ────────────────────────────────────────────────────

function GoogleSignInButton({ onError }: { onError: (msg: string) => void }) {
  const [isLoading, setIsLoading] = useState(false)

  async function handleGoogleSignIn() {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) {
        onError(error.message)
        setIsLoading(false)
      }
      // If no error, browser will redirect — don't reset loading
    } catch {
      onError('Impossible de se connecter avec Google')
      setIsLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50 min-touch"
    >
      {/* Google "G" icon */}
      <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      {isLoading ? 'Redirection...' : 'Continuer avec Google'}
    </button>
  )
}

// ─── Login Form ─────────────────────────────────────────────────────────────

function LoginForm({ onError }: { onError: (msg: string) => void }) {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(data: LoginFormData) {
    setIsSubmitting(true)
    onError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })
      if (error) {
        onError(
          error.message === 'Invalid login credentials'
            ? 'E-mail ou mot de passe incorrect'
            : error.message
        )
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      onError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email */}
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-sm font-medium text-foreground">
          Adresse e-mail
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.email ? 'border-destructive' : 'border-input'
            }`}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Votre mot de passe"
            className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.password ? 'border-destructive' : 'border-input'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 min-touch"
      >
        <LogIn className="h-4 w-4" />
        {isSubmitting ? 'Connexion...' : 'Se connecter'}
      </button>
    </form>
  )
}

// ─── Signup Form ────────────────────────────────────────────────────────────

function SignupForm({
  onError,
  onSuccess,
}: {
  onError: (msg: string) => void
  onSuccess: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  })

  async function onSubmit(data: SignupFormData) {
    setIsSubmitting(true)
    onError('')
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      })
      if (error) {
        onError(error.message)
      } else {
        onSuccess()
      }
    } catch {
      onError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Email */}
      <div>
        <label htmlFor="signup-email" className="mb-1.5 block text-sm font-medium text-foreground">
          Adresse e-mail
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            placeholder="vous@exemple.com"
            className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.email ? 'border-destructive' : 'border-input'
            }`}
            {...register('email')}
          />
        </div>
        {errors.email && (
          <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="signup-password" className="mb-1.5 block text-sm font-medium text-foreground">
          Mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="signup-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Minimum 6 caractères"
            className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.password ? 'border-destructive' : 'border-input'
            }`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
        )}
      </div>

      {/* Confirm password */}
      <div>
        <label htmlFor="signup-confirm" className="mb-1.5 block text-sm font-medium text-foreground">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="signup-confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Retapez votre mot de passe"
            className={`w-full rounded-lg border bg-background py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${
              errors.confirmPassword ? 'border-destructive' : 'border-input'
            }`}
            {...register('confirmPassword')}
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50 min-touch"
      >
        <UserPlus className="h-4 w-4" />
        {isSubmitting ? 'Inscription...' : 'Créer un compte'}
      </button>
    </form>
  )
}
