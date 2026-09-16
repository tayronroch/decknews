-- CreateTable
CREATE TABLE "roles" (
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" BIGINT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "userId" BIGINT NOT NULL,
    "roleId" BIGINT NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("userId", "roleId")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "roleId" BIGINT NOT NULL,
    "permissionId" BIGINT NOT NULL,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("roleId", "permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "user_roles_roleId_idx" ON "user_roles"("roleId");
CREATE INDEX "role_permissions_permissionId_idx" ON "role_permissions"("permissionId");

-- System role IDs are pre-generated TSIDs and are stable for migration/seed idempotency.
INSERT INTO "roles" ("id", "name", "description", "isSystem", "updatedAt") VALUES
  (1987654321098765001, 'Administrador', 'Cargo administrativo do sistema', true, CURRENT_TIMESTAMP),
  (1987654321098765002, 'Usuário', 'Cargo padrão de novos usuários', true, CURRENT_TIMESTAMP);

-- Migrate the legacy enum before dropping it.
INSERT INTO "user_roles" ("userId", "roleId")
SELECT "id", CASE WHEN "role" = 'ADMIN' THEN 1987654321098765001 ELSE 1987654321098765002 END
FROM "users";

ALTER TABLE "users" DROP COLUMN "role";
DROP TYPE "UserRole";

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
