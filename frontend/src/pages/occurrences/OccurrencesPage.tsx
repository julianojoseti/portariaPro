import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Plus, Search, X } from 'lucide-react';
import { occurrencesApi } from '../../services/apiMethods';
import type { Occurrence, OccurrenceStatus } from '../../types';
import { statusColor, statusLabel } from '../../utils/status';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function OccurrencesPage() {
  const [statusFilter, setStatusFilter] = useState<OccurrenceStatus | ''>('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [_selected, _setSelected] = useState<Occurrence | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['occurrences', statusFilter, search],
    queryFn: () => occurrencesApi.list({ status: statusFilter || undefined, search: search || undefined, limit: 50 }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => occurrencesApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['occurrences'] }),
  });

  const occurrences: Occurrence[] = data?.data ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ocorrências</h1>
          <p className="text-gray-500 text-sm mt-1">Registro e acompanhamento de ocorrências</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus className="w-4 h-4" />Nova ocorrência
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(['', 'OPEN', 'IN_ANALYSIS', 'RESOLVED'] as (OccurrenceStatus | '')[]).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${statusFilter === s ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
              {s === '' ? 'Todas' : statusLabel(s)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <p className="text-center py-12 text-gray-400">Carregando...</p>
        ) : occurrences.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Nenhuma ocorrência encontrada.</p>
        ) : (
          occurrences.map((occ) => (
            <div key={occ.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{occ.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{occ.description}</p>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(occ.status)}`}>
                        {statusLabel(occ.status)}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(occ.priority)}`}>
                        {statusLabel(occ.priority)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {format(new Date(occ.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {occ.status === 'OPEN' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: occ.id, data: { status: 'IN_ANALYSIS' } })}
                      className="text-xs px-2.5 py-1.5 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
                      Em análise
                    </button>
                  )}
                  {occ.status === 'IN_ANALYSIS' && (
                    <button
                      onClick={() => updateMutation.mutate({ id: occ.id, data: { status: 'RESOLVED' } })}
                      className="text-xs px-2.5 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <OccurrenceFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['occurrences'] }); }}
        />
      )}
    </div>
  );
}

function OccurrenceFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ type: '', title: '', description: '', priority: 'MEDIUM' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await occurrencesApi.create(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao registrar ocorrência.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Nova Ocorrência</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo *</label>
              <input required type="text" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Barulho, Vazamento..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prioridade</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
                <option value="CRITICAL">Crítica</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Título *</label>
            <input required type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição *</label>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
