import { requirePageUser } from '@/features/auth/services/require-page-user'

export default async function AdminPage() {
  await requirePageUser('/admin')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">Painel Administrativo</h1>
      <p className="text-muted-foreground mt-2">
        Área administrativa do MiniBlog.
      </p>
    </main>
  )
}
