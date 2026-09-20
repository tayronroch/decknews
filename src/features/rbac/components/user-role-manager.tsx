'use client'

import { SearchIcon } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import { AdminPageShell } from '@/components/layout'
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
    <AdminPageShell
      eyebrow="// Usuários"
      title="Usuários e cargos"
      description="Defina quais cargos cada pessoa tem na plataforma."
      backHref="/admin"
      backLabel="Voltar para o painel"
      action={
        <div className="relative w-full sm:w-72">
          <SearchIcon className="text-muted-foreground absolute top-2.5 left-3 size-4" />
          <Input
            className="rounded-xs pl-9"
            placeholder="Buscar usuário..."
            aria-label="Buscar usuário"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      }
    >
      {loading && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-56 rounded-xs" />
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
          hint="Exibir e atribuir cargos também exige a permissão de visualizar cargos. Peça a um administrador para conceder esse acesso."
          onRetry={() => void load()}
        />
      )}

      {!loading && !usersError && filteredUsers.length === 0 && (
        <section className="border-border/70 rounded-xs border border-dashed p-10 text-center">
          <h2 className="text-base font-medium tracking-tight">
            Nenhum usuário encontrado
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Ajuste a busca ou aguarde novos cadastros.
          </p>
        </section>
      )}

      {!loading && !usersError && filteredUsers.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
    </AdminPageShell>
  )
}
