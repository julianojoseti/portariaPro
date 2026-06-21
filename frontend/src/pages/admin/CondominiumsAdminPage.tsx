import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, Trash2, Edit3, X } from 'lucide-react';
import { condominiumsApi, companiesApi } from '../../services/apiMethods';

export default function CondominiumsAdminPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['condominiums', search],
    queryFn: () => condominiumsApi.list({ search: search || undefined, limit: 100 }),
  });

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list({ limit: 500 }),
  });

  const companiesMap = useMemo(() => {
    const map: Record<string, string> = {};
    const list = companiesData?.data ?? [];
    for (const c of list) {
      map[c.id] = c.name;
    }
    return map;
  }, [companiesData]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => condominiumsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['condominiums'] }),
  });

  const condominiums = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Condomínios</h1>
          <p className="text-gray-500 text-sm mt-1">Gerenciamento de todos os condomínios</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />Novo condomínio
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar por nome..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Empresa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Endereço</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Cidade/UF</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Síndico</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : condominiums.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Nenhum condomínio cadastrado.</td></tr>
              ) : (
                condominiums.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {companiesMap[c.companyId] ?? c.companyId ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{c.address ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {c.city && c.state ? `${c.city}/${c.state}` : c.city || c.state || '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{c.managerName ?? '—'}</td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status === 'ACTIVE' ? 'Ativo' : c.status === 'INACTIVE' ? 'Inativo' : c.status ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditing(c); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Remover condomínio?')) deleteMutation.mutate(c.id); }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
        <CondominiumFormModal
          condominium={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['condominiums'] }); }}
        />
      )}
    </div>
  );
}

function CondominiumFormModal({ condominium, onClose, onSuccess }: { condominium: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    companyId: condominium?.companyId ?? '',
    name: condominium?.name ?? '',
    cnpj: condominium?.cnpj ?? '',
    address: condominium?.address ?? '',
    city: condominium?.city ?? '',
    state: condominium?.state ?? '',
    zipCode: condominium?.zipCode ?? '',
    phone: condominium?.phone ?? '',
    email: condominium?.email ?? '',
    managerName: condominium?.managerName ?? '',
    managerPhone: condominium?.managerPhone ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companiesApi.list({ limit: 500 }),
  });

  const companies = companiesData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: Record<string, unknown> = { ...form };
      // Remove empty optional strings so the backend doesn't store blanks
      for (const key of Object.keys(payload)) {
        if (payload[key] === '') delete payload[key];
      }
      // companyId and name are required
      payload.companyId = form.companyId;
      payload.name = form.name;

      if (condominium) await condominiumsApi.update(condominium.id, payload);
      else await condominiumsApi.create(payload);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar condomínio.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{condominium ? 'Editar Condomínio' : 'Novo Condomínio'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Empresa *</label>
            <select required value={form.companyId} onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className={inputClass}>
              <option value="">Selecione uma empresa</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} placeholder="Nome do condomínio" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CNPJ</label>
              <input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                className={inputClass} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CEP</label>
              <input type="text" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                className={inputClass} placeholder="00000-000" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Endereço</label>
            <input type="text" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className={inputClass} placeholder="Rua, número, complemento" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Cidade</label>
              <input type="text" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass} placeholder="Cidade" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Estado (UF)</label>
              <input type="text" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputClass} placeholder="SP" maxLength={2} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass} placeholder="(00) 0000-0000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass} placeholder="contato@cond.com" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome do Síndico</label>
              <input type="text" value={form.managerName} onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                className={inputClass} placeholder="Nome completo" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone do Síndico</label>
              <input type="text" value={form.managerPhone} onChange={(e) => setForm({ ...form, managerPhone: e.target.value })}
                className={inputClass} placeholder="(00) 00000-0000" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
