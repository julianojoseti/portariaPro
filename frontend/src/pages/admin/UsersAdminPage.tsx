import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit3, Trash2, X, Shield } from 'lucide-react';
import { usersApi, condominiumsApi } from '../../services/apiMethods';
import { useAuthStore } from '../../store/authStore';
import type { Role } from '../../types';

// Fetch roles from the existing users list (each user has role.id and role.name)
// This is a temporary approach until a dedicated roles endpoint exists

interface RoleObj {
  id: string;
  name: string;
  description?: string;
}

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  isActive: boolean;
  role: RoleObj;
  condominiums?: { condominium: { id: string; name: string } }[];
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Admin Empresa',
  MANAGER: 'Gestor',
  DOORMAN: 'Porteiro',
  RESIDENT: 'Morador',
  EMPLOYEE: 'Funcionário',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700',
  COMPANY_ADMIN: 'bg-blue-100 text-blue-700',
  MANAGER: 'bg-indigo-100 text-indigo-700',
  DOORMAN: 'bg-amber-100 text-amber-700',
  RESIDENT: 'bg-green-100 text-green-700',
  EMPLOYEE: 'bg-gray-100 text-gray-700',
};

const ALL_ROLES: Role[] = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'MANAGER', 'DOORMAN', 'RESIDENT', 'EMPLOYEE'];
const NON_SUPER_ROLES: Role[] = ['MANAGER', 'DOORMAN', 'RESIDENT', 'EMPLOYEE'];

export default function UsersAdminPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => usersApi.list({ search: search || undefined, limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: UserRow[] = data?.data ?? [];

  // Extract unique roles from fetched users for the create/edit form
  const rolesMap = useMemo(() => {
    const map = new Map<string, RoleObj>();
    users.forEach((u) => {
      if (u.role?.id && u.role?.name) {
        map.set(u.role.name, { id: u.role.id, name: u.role.name, description: u.role.description });
      }
    });
    return map;
  }, [users]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500 text-sm mt-1">Gerenciamento de usuários do sistema</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />Novo usuário
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Email</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Perfil</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Condomínio(s)</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Nenhum usuário cadastrado.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500 sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[u.role?.name] ?? 'bg-gray-100 text-gray-700'}`}>
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[u.role?.name] ?? u.role?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">
                      {u.condominiums && u.condominiums.length > 0
                        ? u.condominiums.map((c) => c.condominium.name).join(', ')
                        : '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {u.isActive !== false ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">Ativo</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">Inativo</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditing(u); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Remover usuário?')) deleteMutation.mutate(u.id); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <UserFormModal
          userRow={editing}
          isSuperAdmin={isSuperAdmin}
          rolesMap={rolesMap}
          activeCondominiumId={user?.activeCondominiumId ?? null}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['admin-users'] }); }}
        />
      )}
    </div>
  );
}

function UserFormModal({
  userRow,
  isSuperAdmin,
  rolesMap,
  activeCondominiumId,
  onClose,
  onSuccess,
}: {
  userRow: UserRow | null;
  isSuperAdmin: boolean;
  rolesMap: Map<string, RoleObj>;
  activeCondominiumId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const isEditing = !!userRow;

  const [form, setForm] = useState({
    name: userRow?.name ?? '',
    email: userRow?.email ?? '',
    password: '',
    phone: userRow?.phone ?? '',
    roleName: userRow?.role?.name ?? (isSuperAdmin ? 'MANAGER' : 'DOORMAN'),
    condominiumId: activeCondominiumId ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // For SUPER_ADMIN: fetch all condominiums for the dropdown
  const { data: condData } = useQuery({
    queryKey: ['condominiums-select'],
    queryFn: () => condominiumsApi.list({ limit: 200 }),
    enabled: isSuperAdmin && !isEditing,
  });
  const condominiums = condData?.data ?? [];

  const availableRoles = isSuperAdmin ? ALL_ROLES : NON_SUPER_ROLES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditing) {
        // Update: name, phone, roleId
        const roleObj = rolesMap.get(form.roleName);
        const payload: Record<string, unknown> = {
          name: form.name,
          phone: form.phone || undefined,
        };
        if (roleObj) {
          payload.roleId = roleObj.id;
        }
        await usersApi.update(userRow.id, payload);
      } else {
        // Create: need roleId (UUID)
        const roleObj = rolesMap.get(form.roleName);
        if (!roleObj) {
          setError(`Perfil "${ROLE_LABELS[form.roleName] ?? form.roleName}" não encontrado. Verifique se existe pelo menos um usuário com esse perfil no sistema.`);
          setLoading(false);
          return;
        }

        const payload: Record<string, unknown> = {
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          roleId: roleObj.id,
        };

        // Add condominiumId
        if (isSuperAdmin && form.condominiumId) {
          payload.condominiumId = form.condominiumId;
        } else if (!isSuperAdmin && activeCondominiumId) {
          payload.condominiumId = activeCondominiumId;
        }

        await usersApi.create(payload);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar usuário.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
            />
          </div>

          {/* Email - only on create */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="email@exemplo.com"
              />
            </div>
          )}

          {/* Senha - only on create */}
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha *</label>
              <input
                required
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mínimo 8 caracteres"
              />
            </div>
          )}

          {/* Telefone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* Perfil (role) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Perfil *</label>
            <select
              required
              value={form.roleName}
              onChange={(e) => setForm({ ...form, roleName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r] ?? r}</option>
              ))}
            </select>
          </div>

          {/* Condomínio - only on create */}
          {!isEditing && isSuperAdmin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condomínio</label>
              <select
                value={form.condominiumId}
                onChange={(e) => setForm({ ...form, condominiumId: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhum (atribuir depois)</option>
                {condominiums.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Condomínio info - COMPANY_ADMIN sees their active condominium */}
          {!isEditing && !isSuperAdmin && activeCondominiumId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Condomínio</label>
              <input
                type="text"
                disabled
                value="Condomínio ativo (automático)"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500"
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
