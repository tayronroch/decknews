import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getSafeNext } from '@/features/auth/client'
import { AuthPageShell, RegisterForm } from '@/features/auth/components'
import { getCurrentUserBySessionToken } from '@/features/auth/services'
import { SESSION_COOKIE_NAME } from '@/infra/http'

type RegisterPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { next: requestedNext } = await searchParams
  const next = getSafeNext(requestedNext)
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserBySessionToken(token)

  if (user) redirect(next)

  return (
    <AuthPageShell
      title="Criar conta"
      description="Crie sua conta para começar a usar o Decknews."
      footer={
        <>
          Já tem uma conta?{' '}
          <Link
            className="text-primary font-medium hover:underline"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Entrar
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthPageShell>
  )
}
