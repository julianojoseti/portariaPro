import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, Trash2, Edit3, X } from 'lucide-react';
import { unitsApi } from '../../services/apiMethods';

export default function UnitsPage() {
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['units', search],
    queryFn: () => unitsApi.list({ search: search || undefined, limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => unitsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
  });

  const units = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unidades</h1>
          <p className="text-gray-500 text-sm mt-1">Apartamentos, casas e salas comerciais</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />Nova unidade
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Buscar por número..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Unidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Bloco</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Moradores</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : units.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhuma unidade cadastrada.</td></tr>
              ) : (
                units.map((u: any) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-gray-500" />
                        </div>
                        <span className="font-medium text-gray-900">Apto {u.number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">{u.block ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell capitalize">{u.type}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                      {u._count?.residents ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditing(u); setShowForm(true); }}
                          className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if (confirm('Remover unidade?')) deleteMutation.mutate(u.id); }}
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
        <UnitFormModal
          unit={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSuccess={() => { setShowForm(false); setEditing(null); qc.invalidateQueries({ queryKey: ['units'] }); }}
        />
      )}
    </div>
  );
}

function UnitFormModal({ unit, onClose, onSuccess }: { unit: any; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ block: unit?.block ?? '', number: unit?.number ?? '', type: unit?.type ?? 'apartment', floor: unit?.floor ?? '', parkingSpots: unit?.parkingSpots ?? 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = { ...form, floor: form.floor ? +form.floor : undefined, parkingSpots: +form.parkingSpots };
      if (unit) await unitsApi.update(unit.id, payload);
      else await unitsApi.create(payload);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao salvar unidade.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">{unit ? 'Editar Unidade' : 'Nova Unidade'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bloco</label>
              <input type="text" value={form.block} onChange={(e) => setForm({ ...form, block: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="A, B, C..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Número *</label>
              <input required type="text" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="101" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="apartment">Apartamento</option>
                <option value="house">Casa</option>
                <option value="commercial">Comercial</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Andar</label>
              <input type="number" value={form.floor} onChange={(e) => setForm({ ...form, floor: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vagas</label>
              <input type="number" min={0} value={form.parkingSpots} onChange={(e) => setForm({ ...form, parkingSpots: +e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
