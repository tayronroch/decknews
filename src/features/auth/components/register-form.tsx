'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { authClient, AuthClientError } from '../client'
import { registerSchema } from '../schemas'

type FieldErrors = {
  confirmPassword?: string
  email?: string
  name?: string
  password?: string
}

const GENERIC_ERROR_MESSAGE = 'Não foi possível criar a conta. Tente novamente.'

const VALIDATION_MESSAGES: Required<Omit<FieldErrors, 'confirmPassword'>> = {
  name: 'Nome deve ter entre 2 e 100 caracteres',
  email: 'E-mail inválido',
  password: 'Senha deve ter entre 12 e 256 caracteres',
}

function errorAttributes(error: string | undefined, errorId: string) {
  return {
    'aria-describedby': error ? errorId : undefined,
    'aria-invalid': Boolean(error),
  }
}

type FieldErrorProps = {
  error: string | undefined
  id: string
}

function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null

  return (
    <p id={id} className="text-destructive text-sm" role="alert">
      {error}
    </p>
  )
}

export function RegisterForm() {
  const router = useRouter()
  const submittingRef = useRef(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (submittingRef.current) return

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'As senhas não coincidem.' })
      setFormError(null)
      return
    }

    const parsed = registerSchema.safeParse({ name, email, password })
    if (!parsed.success) {
      const errors: FieldErrors = {}
      const invalidFields = new Set(
        parsed.error.issues.map((issue) => issue.path[0])
      )

      if (invalidFields.has('name')) errors.name = VALIDATION_MESSAGES.name
      if (invalidFields.has('email')) errors.email = VALIDATION_MESSAGES.email
      if (invalidFields.has('password')) {
        errors.password = VALIDATION_MESSAGES.password
      }

      setFieldErrors(errors)
      setFormError(null)
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    setFieldErrors({})
    setFormError(null)

    try {
      await authClient.register({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      })
      router.replace('/login')
    } catch (error) {
      setFormError(
        error instanceof AuthClientError && error.statusCode === 409
          ? 'E-mail já cadastrado'
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
        <Label htmlFor="register-name">Nome</Label>
        <Input
          id="register-name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          {...errorAttributes(fieldErrors.name, 'register-name-error')}
          disabled={isSubmitting}
        />
        <FieldError error={fieldErrors.name} id="register-name-error" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">E-mail</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          {...errorAttributes(fieldErrors.email, 'register-email-error')}
          disabled={isSubmitting}
        />
        <FieldError error={fieldErrors.email} id="register-email-error" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Senha</Label>
        <Input
          id="register-password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          {...errorAttributes(fieldErrors.password, 'register-password-error')}
          disabled={isSubmitting}
        />
        <FieldError error={fieldErrors.password} id="register-password-error" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-confirm-password">Confirmar senha</Label>
        <Input
          id="register-confirm-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          {...errorAttributes(
            fieldErrors.confirmPassword,
            'register-confirm-password-error'
          )}
          disabled={isSubmitting}
        />
        <FieldError
          error={fieldErrors.confirmPassword}
          id="register-confirm-password-error"
        />
      </div>
      {formError ? (
        <p className="text-destructive text-sm" role="alert">
          {formError}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
