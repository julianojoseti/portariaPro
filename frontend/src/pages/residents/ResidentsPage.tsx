import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Trash2, Edit3, X } from 'lucide-react';
import { residentsApi, unitsApi } from '../../services/apiMethods';
import type { Resident } from '../../types';

export default function ResidentsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Resident | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['residents', search],
    queryFn: () => residentsApi.list({ search: search || undefined, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => residentsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['residents'] }),
  });

  const residents: Resident[] = data?.data ?? [];

  const residentTypeLabel = (type: string) => ({
    OWNER: 'Proprietário', TENANT: 'Inquilino', DEPENDENT: 'Dependente', DOMESTIC_EMPLOYEE: 'Funcionário Doméstico',
  }[type] ?? type);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moradores</h1>
          <p className="text-gray-500 text-sm mt-1">Gerenciamento de moradores e residentes</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />Novo morador
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar por nome, CPF..."
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
                <th className="text-left px-4 py-3 font-medium text-gray-600">Morador</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Unidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Contato</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : residents.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhum morador cadastrado.</td></tr>
              ) : (
                residents.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                          {r.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{r.name}</p>
                          {r.document && <p className="text-xs text-gray-500">CPF: {r.document}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {r.unit ? `${r.unit.block ? `Bloco ${r.unit.block} ` : ''}Apto ${r.unit.number}` : '—'}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                        {residentTypeLabel(r.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs hidden lg:table-cell">
                      {r.phone ?? r.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditing(r); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Remover morador?')) deleteMutation.mutate(r.id); }}
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
        <ResidentFormModal
          resident={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['residents'] }); }}
        />
      )}
    </div>
  );
}

function ResidentFormModal({ resident, onClose, onSuccess }: {
  resident: Resident | null; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    name: resident?.name ?? '',
    document: resident?.document ?? '',
    phone: resident?.phone ?? '',
    email: resident?.email ?? '',
    type: resident?.type ?? 'OWNER',
    unitId: resident?.unitId ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { data: unitsData } = useQuery({ queryKey: ['units'], queryFn: () => unitsApi.list({ limit: 200 }) });
  const units = unitsData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (resident) {
        await residentsApi.update(resident.id, form);
      } else {
        await residentsApi.create(form);
      }
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar morador.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{resident ? 'Editar Morador' : 'Novo Morador'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade *</label>
            <select required value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Selecione...</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>{u.block ? `Bloco ${u.block} - ` : ''}Apto {u.number}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome completo *</label>
            <input required type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">CPF</label>
              <input type="text" value={form.document} onChange={(e) => setForm({ ...form, document: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone</label>
              <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="OWNER">Proprietário</option>
              <option value="TENANT">Inquilino</option>
              <option value="DEPENDENT">Dependente</option>
              <option value="DOMESTIC_EMPLOYEE">Funcionário Doméstico</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
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
