import type { StatusResponse } from '@/features/status/types/status-response'
import { env } from '@/lib/env/server'

import { StatusRefresher } from './status-refresher'

async function fetchStatus(): Promise<StatusResponse | null> {
  const baseUrl = env.APP_URL ?? `http://localhost:${env.PORT}`
  const url = `${baseUrl}/api/v1/status`

  try {
    const response = await fetch(url, { cache: 'no-store' })

    if (!response.ok) {
      return null
    }

    return (await response.json()) as StatusResponse
  } catch {
    return null
  }
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'medium',
    timeZone: 'America/Sao_Paulo',
  })
}

export default async function StatusPage() {
  const data = await fetchStatus()

  if (!data) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
        <StatusRefresher />
        <h1 className="mb-4 text-2xl font-bold text-red-400">
          Serviço indisponível
        </h1>
        <p className="text-slate-400">
          Não foi possível verificar o status da aplicação no momento.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <StatusRefresher />
      <h1 className="mb-8 text-2xl font-bold text-slate-50">
        Status da Aplicação
      </h1>

      <dl className="w-full max-w-sm space-y-4 text-left">
        <div className="flex items-center justify-between rounded-md bg-slate-800 px-4 py-3">
          <dt className="text-sm text-slate-400">Status</dt>
          <dd className="font-mono text-sm font-medium text-green-400">
            {data.status}
          </dd>
        </div>

        <div className="flex items-center justify-between rounded-md bg-slate-800 px-4 py-3">
          <dt className="text-sm text-slate-400">Banco de dados</dt>
          <dd className="font-mono text-sm font-medium text-green-400">
            {data.database.status}
          </dd>
        </div>

        <div className="flex items-center justify-between rounded-md bg-slate-800 px-4 py-3">
          <dt className="text-sm text-slate-400">Conexões abertas</dt>
          <dd className="font-mono text-sm text-slate-300">
            {data.database.connections} / {data.database.poolLimit}
          </dd>
        </div>

        <div className="flex items-center justify-between rounded-md bg-slate-800 px-4 py-3">
          <dt className="text-sm text-slate-400">Última consulta</dt>
          <dd className="font-mono text-sm text-slate-300">
            {formatTimestamp(data.updatedAt)}
          </dd>
        </div>
      </dl>
    </main>
  )
}
