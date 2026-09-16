import { cookies } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { getSafeNext } from '@/features/auth/client'
import { AuthPageShell, LoginForm } from '@/features/auth/components'
import { getCurrentUserBySessionToken } from '@/features/auth/services'
import { SESSION_COOKIE_NAME } from '@/infra/http'

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next: requestedNext } = await searchParams
  const next = getSafeNext(requestedNext)
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value
  const user = await getCurrentUserBySessionToken(token)

  if (user) redirect(next)

  return (
    <AuthPageShell
      title="Entrar"
      description="Acesse sua conta para continuar no Decknews."
      footer={
        <>
          Ainda não tem uma conta?{' '}
          <Link
            className="text-primary font-medium hover:underline"
            href={`/register?next=${encodeURIComponent(next)}`}
          >
            Criar conta
          </Link>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthPageShell>
  )
}
