'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { authClient, AuthClientError } from '../client'
import { loginSchema } from '../schemas'

type LoginFormProps = {
  next: string
}

type FieldErrors = {
  email?: string
  password?: string
}

const GENERIC_ERROR_MESSAGE = 'Não foi possível entrar. Tente novamente.'

const VALIDATION_MESSAGES: Required<FieldErrors> = {
  email: 'E-mail inválido',
  password: 'Senha é obrigatória',
}

export function LoginForm({ next }: LoginFormProps) {
  const router = useRouter()
  const submittingRef = useRef(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) return

    const parsed = loginSchema.safeParse({ email, password })
    if (!parsed.success) {
      const errors: FieldErrors = {}
      const invalidFields = new Set(
        parsed.error.issues.map((issue) => issue.path[0])
      )

      if (invalidFields.has('email')) errors.email = VALIDATION_MESSAGES.email
      if (invalidFields.has('password'))
        errors.password = VALIDATION_MESSAGES.password

      setFieldErrors(errors)
      setFormError(null)
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    try {
      await authClient.login(parsed.data)
      try {
        await authClient.getCurrentUser()
      } catch {
        setFormError('Não foi possível confirmar a sessão. Tente novamente.')
        return
      }
      router.replace(next)
      router.refresh()
    } catch (error) {
      setFormError(
        error instanceof AuthClientError && error.statusCode === 401
          ? 'Credenciais inválidas'
          : GENERIC_ERROR_MESSAGE
      )
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit} noValidate>
      <div className="space-y-2">
        <Label htmlFor="login-email">E-mail</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
          disabled={isSubmitting}
        />
        {fieldErrors.email ? (
          <p
            id="login-email-error"
            className="text-destructive text-sm"
            role="alert"
          >
            {fieldErrors.email}
          </p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-password">Senha</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby={
            fieldErrors.password ? 'login-password-error' : undefined
          }
          disabled={isSubmitting}
        />
        {fieldErrors.password ? (
          <p
            id="login-password-error"
            className="text-destructive text-sm"
            role="alert"
          >
            {fieldErrors.password}
          </p>
        ) : null}
      </div>
      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
