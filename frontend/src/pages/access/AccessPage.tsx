import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LogIn, LogOut, CheckCircle, XCircle, Package,
  Plus, Search, RefreshCw, User,
} from 'lucide-react';
import { accessLogsApi } from '../../services/apiMethods';
import type { AccessLog, PersonType } from '../../types';
import { statusLabel, statusColor } from '../../utils/status';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Tab = 'inside' | 'waiting' | 'all';

export default function AccessPage() {
  const [tab, setTab] = useState<Tab>('inside');
  const [search, setSearch] = useState('');
  const [showEntryForm, setShowEntryForm] = useState(false);
  const qc = useQueryClient();

  const { data: insideData, isLoading: insideLoading } = useQuery({
    queryKey: ['access-logs', 'inside'],
    queryFn: accessLogsApi.inside,
    refetchInterval: 15_000,
  });

  const { data: waitingData } = useQuery({
    queryKey: ['access-logs', 'list', { status: 'WAITING' }],
    queryFn: () => accessLogsApi.list({ status: 'WAITING', limit: 50 }),
    refetchInterval: 15_000,
  });

  const { data: allData } = useQuery({
    queryKey: ['access-logs', 'list', { search }],
    queryFn: () => accessLogsApi.list({ search: search || undefined, limit: 20 }),
    enabled: tab === 'all',
  });

  const exitMutation = useMutation({
    mutationFn: (id: string) => accessLogsApi.registerExit(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-logs'] }),
  });

  const authorizeMutation = useMutation({
    mutationFn: (id: string) => accessLogsApi.authorize(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-logs'] }),
  });

  const denyMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      accessLogsApi.deny(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['access-logs'] }),
  });

  const insideList: AccessLog[] = Array.isArray(insideData) ? insideData : [];
  const waitingList: AccessLog[] = waitingData?.data ?? [];
  const allList: AccessLog[] = allData?.data ?? [];

  const currentList =
    tab === 'inside' ? insideList :
    tab === 'waiting' ? waitingList :
    allList;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Acesso</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie entradas, saídas e autorizações</p>
        </div>
        <button
          onClick={() => setShowEntryForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar entrada
        </button>
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Entrada', icon: LogIn, color: 'bg-green-600 hover:bg-green-700', action: () => setShowEntryForm(true) },
          { label: 'Saída', icon: LogOut, color: 'bg-orange-500 hover:bg-orange-600', action: () => setTab('inside') },
          { label: 'Autorizar', icon: CheckCircle, color: 'bg-blue-600 hover:bg-blue-700', action: () => setTab('waiting') },
          { label: 'Encomenda', icon: Package, color: 'bg-purple-600 hover:bg-purple-700', action: () => window.location.href = '/packages' },
        ].map(({ label, icon: Icon, color, action }) => (
          <button
            key={label}
            onClick={action}
            className={`${color} text-white rounded-xl py-4 flex flex-col items-center gap-2 transition-colors`}
          >
            <Icon className="w-6 h-6" />
            <span className="text-sm font-semibold">{label}</span>
          </button>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'inside' as Tab, label: `Dentro (${insideList.length})` },
          { key: 'waiting' as Tab, label: `Aguardando (${waitingList.length})` },
          { key: 'all' as Tab, label: 'Histórico' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search (only for all tab) */}
      {tab === 'all' && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, documento, placa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Pessoa</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Tipo</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Entrada</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400">
                    {insideLoading ? 'Carregando...' : 'Nenhum registro encontrado.'}
                  </td>
                </tr>
              ) : (
                currentList.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{log.personName}</p>
                          {log.vehiclePlate && (
                            <p className="text-xs text-gray-500">{log.vehiclePlate}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                      {log.personType === 'VISITOR' ? 'Visitante' :
                        log.personType === 'SERVICE_PROVIDER' ? 'Prestador' :
                        log.personType === 'DELIVERY' ? 'Entrega' :
                        log.personType === 'RESIDENT' ? 'Morador' : log.personType}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {log.entryAt
                        ? format(new Date(log.entryAt), "dd/MM HH:mm", { locale: ptBR })
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(log.status)}`}>
                        {statusLabel(log.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {log.status === 'WAITING' && (
                          <>
                            <button
                              onClick={() => authorizeMutation.mutate(log.id)}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Autorizar"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Motivo da negação:');
                                if (reason !== null) denyMutation.mutate({ id: log.id, reason });
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Negar"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {log.status === 'INSIDE' && (
                          <button
                            onClick={() => exitMutation.mutate(log.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-orange-600 border border-orange-200 rounded-lg text-xs font-medium hover:bg-orange-50 transition-colors"
                          >
                            <LogOut className="w-3 h-3" />
                            Saída
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Entry Form Modal */}
      {showEntryForm && (
        <EntryFormModal
          onClose={() => setShowEntryForm(false)}
          onSuccess={() => {
            setShowEntryForm(false);
            qc.invalidateQueries({ queryKey: ['access-logs'] });
          }}
        />
      )}
    </div>
  );
}

function EntryFormModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    personType: 'VISITOR' as PersonType,
    personName: '',
    personDocument: '',
    vehiclePlate: '',
    purpose: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await accessLogsApi.registerEntry(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao registrar entrada.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Registrar Entrada</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <XCircle className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tipo</label>
            <select
              value={form.personType}
              onChange={(e) => setForm({ ...form, personType: e.target.value as PersonType })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="VISITOR">Visitante</option>
              <option value="SERVICE_PROVIDER">Prestador de Serviço</option>
              <option value="DELIVERY">Entrega</option>
              <option value="RESIDENT">Morador</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nome *</label>
            <input
              type="text"
              required
              value={form.personName}
              onChange={(e) => setForm({ ...form, personName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome completo"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Documento</label>
              <input
                type="text"
                value={form.personDocument}
                onChange={(e) => setForm({ ...form, personDocument: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="CPF / RG"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Placa</label>
              <input
                type="text"
                value={form.vehiclePlate}
                onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ABC-1234"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo</label>
            <input
              type="text"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: visita, serviço, entrega..."
            />
          </div>

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
              className="flex-1 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
              <LogIn className="w-4 h-4" />
              Registrar entrada
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
