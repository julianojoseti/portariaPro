# Portaria Pro

Sistema SaaS multiempresa/multicondomínio para **controle de acesso em portarias de condomínios**.

---

## Stack

| Camada     | Tecnologia                                  |
|------------|---------------------------------------------|
| Front-end  | React 18 + Vite + TypeScript + TailwindCSS  |
| Back-end   | NestJS + TypeScript                         |
| Banco      | PostgreSQL                                  |
| ORM        | Prisma                                      |
| Auth       | JWT (access + refresh token)                |
| Estado     | Zustand + React Query                       |

---

## Estrutura do projeto

```
portaria-pro/
├── backend/         # API NestJS
│   ├── src/
│   │   ├── auth/          # Login, JWT, refresh token
│   │   ├── users/         # Usuários e RBAC
│   │   ├── condominiums/  # Condomínios
│   │   ├── units/         # Unidades
│   │   ├── residents/     # Moradores
│   │   ├── access-logs/   # Entradas/saídas (portaria)
│   │   ├── packages/      # Encomendas
│   │   ├── occurrences/   # Ocorrências
│   │   ├── dashboard/     # KPIs em tempo real
│   │   ├── reports/       # Relatórios
│   │   ├── audit/         # Log de auditoria
│   │   └── common/        # Guards, interceptors, decorators
│   └── prisma/
│       ├── schema.prisma  # Schema completo multi-tenant
│       └── seed.ts        # Dados iniciais
└── frontend/        # SPA React
    └── src/
        ├── pages/         # Telas do sistema
        ├── components/    # Layout e UI
        ├── services/      # Chamadas de API
        ├── store/         # Estado global (Zustand)
        ├── types/         # Types TypeScript
        └── utils/         # Helpers
```

---

## Pré-requisitos

- Node.js ≥ 18
- PostgreSQL ≥ 14

---

## Instalação e execução

### 1. Clone o repositório

```bash
git clone <repo-url>
cd portaria-pro
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edite .env e configure DATABASE_URL, JWT_SECRET e JWT_REFRESH_SECRET

npm install
npx prisma migrate dev --name init
npm run db:seed     # Cria Super Admin, empresa e condomínio demo
npm run start:dev   # API em http://localhost:3001
```

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev         # App em http://localhost:5173
```

---

## Credenciais de demonstração

| Perfil         | E-mail                         | Senha           |
|----------------|--------------------------------|-----------------|
| Super Admin    | admin@portariapro.com.br       | Admin@2024!     |
| Admin da Empresa | admin@admindemo.com.br       | Demo@2024!      |
| Porteiro       | porteiro@admindemo.com.br      | Porteiro@2024!  |

---

## Arquitetura Multi-Tenant (segurança crítica)

- Todo dado operacional possui `companyId` + `condominiumId`.
- O `TenantGuard` extrai o contexto **exclusivamente do JWT** — nunca do body/query.
- Qualquer tentativa de acessar recurso fora do tenant resulta em **HTTP 403**.
- O `AuditInterceptor` registra automaticamente toda ação crítica (CREATE/UPDATE/DELETE) em `AuditLog`.
- Soft delete em todas as entidades operacionais — nenhum dado histórico é excluído fisicamente.

---

## Perfis de usuário (RBAC)

| Perfil          | Escopo       |
|-----------------|--------------|
| SUPER_ADMIN     | Plataforma   |
| COMPANY_ADMIN   | Empresa      |
| MANAGER         | Condomínio   |
| DOORMAN         | Portaria     |
| RESIDENT        | Própria unidade |
| EMPLOYEE        | Condomínio   |

---

## Telas implementadas

- [x] Login
- [x] Seleção de condomínio
- [x] Troca de senha obrigatória
- [x] Dashboard (KPIs em tempo real)
- [x] Portaria / Controle de acesso
- [x] Moradores
- [x] Unidades
- [x] Encomendas
- [x] Ocorrências
- [x] Relatórios
- [x] Auditoria
- [ ] Visitantes (CRUD completo — stub)
- [ ] Prestadores de serviço (CRUD completo — stub)
- [ ] Veículos (CRUD completo — stub)
- [ ] Comunicados
- [ ] Usuários e permissões
- [ ] Importação via Excel

---

## Variáveis de ambiente (backend)

```env
APP_NAME="Portaria Pro"
DATABASE_URL="postgresql://user:pass@host:5432/portaria_pro"
JWT_SECRET=<chave forte, 32+ chars>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<chave diferente da anterior>
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
PORT=3001
```

---

## Deploy sugerido

| Serviço    | Opção                           |
|------------|---------------------------------|
| Frontend   | Vercel (conectar pasta `frontend/`) |
| Backend    | Render / Railway / Fly.io       |
| Banco      | Neon / Supabase / Railway Postgres |

---

## Checklist de segurança

- [x] Nenhuma query sem filtro de `companyId` + `condominiumId`
- [x] `companyId`/`condominiumId` sempre do JWT, nunca do client
- [x] Soft delete em todas entidades operacionais
- [x] Log de auditoria automático via interceptor
- [x] Guards separados: JWT + Tenant + RBAC
- [x] Proteção contra força bruta (ThrottlerGuard)
- [x] Helmet + CORS configurados
- [x] Senhas com bcrypt (salt 12)

---

*Portaria Pro — © 2024. Antes de registrar a marca comercialmente, valide disponibilidade no INPI e domínios (.com.br / .com).*
