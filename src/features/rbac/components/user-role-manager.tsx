'use client'

import { SearchIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

import { rbacClient } from '../client'
import type { AdminUserDto, RoleDto, UserPanelCapabilities } from '../types'
import { LoadingError } from './loading-error'
import { UserCard } from './user-card'

function messageOf(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}

export function UserRoleManager({
  capabilities,
}: {
  capabilities: UserPanelCapabilities
}) {
  const [users, setUsers] = useState<AdminUserDto[]>([])
  const [roles, setRoles] = useState<RoleDto[]>([])
  const [loading, setLoading] = useState(true)
  const [usersError, setUsersError] = useState<string | null>(null)
  const [rolesError, setRolesError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setUsersError(null)
    setRolesError(null)

    const [userResult, roleResult] = await Promise.allSettled([
      rbacClient.listUsers(),
      rbacClient.listRoles(),
    ])

    if (userResult.status === 'fulfilled') setUsers(userResult.value)
    else
      setUsersError(
        messageOf(userResult.reason, 'Não foi possível carregar os usuários.')
      )

    if (roleResult.status === 'fulfilled') setRoles(roleResult.value)
    else
      setRolesError(
        messageOf(roleResult.reason, 'Não foi possível carregar os cargos.')
      )

    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function upsertUser(saved: AdminUserDto) {
    // Untouched users keep their object identity so UserCard's savedIds
    // effect (keyed on `user`) doesn't fire and wipe unsaved local edits.
    setUsers((current) =>
      current.map((user) => (user.id === saved.id ? saved : user))
    )
  }

  const term = search.trim().toLocaleLowerCase('pt-BR')
  const filteredUsers = users.filter(
    (user) =>
      term === '' ||
      user.name.toLocaleLowerCase('pt-BR').includes(term) ||
      user.email.toLocaleLowerCase('pt-BR').includes(term)
  )

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Usuários e cargos</h1>
        <p className="text-muted-foreground mt-2">
          Defina quais cargos cada pessoa tem na plataforma.
        </p>
      </header>

      <div className="relative mb-6">
        <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 size-4" />
        <Input
          className="pl-9"
          placeholder="Buscar usuário..."
          aria-label="Buscar usuário"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {loading && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-56" />
          ))}
        </div>
      )}

      {!loading && usersError && (
        <LoadingError
          title="Não foi possível carregar os usuários"
          message={usersError}
          onRetry={() => void load()}
        />
      )}

      {!loading && rolesError && (
        <LoadingError
          title="Não foi possível carregar os cargos"
          message={rolesError}
          onRetry={() => void load()}
        />
      )}

      {!loading && !usersError && filteredUsers.length === 0 && (
        <section className="rounded-xl border border-dashed p-10 text-center">
          <h2 className="font-semibold">Nenhum usuário encontrado</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ajuste a busca ou aguarde novos cadastros.
          </p>
        </section>
      )}

      {!loading && !usersError && filteredUsers.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              roles={roles}
              canManageRoles={capabilities.canManageRoles}
              onUpdated={upsertUser}
            />
          ))}
        </div>
      )}
    </main>
  )
}
