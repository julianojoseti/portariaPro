import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Plus, CheckCircle, RotateCcw, X } from 'lucide-react';
import { packagesApi, unitsApi } from '../../services/apiMethods';
import type { PackageDelivery, PackageStatus } from '../../types';
import { statusColor, statusLabel } from '../../utils/status';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PackagesPage() {
  const [statusFilter, setStatusFilter] = useState<PackageStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['packages', statusFilter],
    queryFn: () => packagesApi.list({ status: statusFilter || undefined, limit: 50 }),
  });

  const retrieveMutation = useMutation({
    mutationFn: (id: string) => {
      const name = prompt('Nome de quem está retirando:');
      if (!name) return Promise.reject('cancelled');
      return packagesApi.retrieve(id, { retrievedByName: name });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });

  const returnMutation = useMutation({
    mutationFn: (id: string) => packagesApi.markReturned(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['packages'] }),
  });

  const packages: PackageDelivery[] = data?.data ?? [];

  const statusTabs: { value: PackageStatus | ''; label: string }[] = [
    { value: '', label: 'Todas' },
    { value: 'WAITING_PICKUP', label: 'Aguardando' },
    { value: 'RETRIEVED', label: 'Retiradas' },
    { value: 'RETURNED', label: 'Devolvidas' },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encomendas</h1>
          <p className="text-gray-500 text-sm mt-1">Controle de recebimento e retirada</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Registrar encomenda
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit flex-wrap">
        {statusTabs.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              statusFilter === value
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Destinatário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Transportadora</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Recebida em</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : packages.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhuma encomenda encontrada.</td></tr>
              ) : (
                packages.map((pkg) => (
                  <tr key={pkg.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-400 shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">{pkg.recipientName}</p>
                          {pkg.trackingCode && (
                            <p className="text-xs text-gray-500">{pkg.trackingCode}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {pkg.carrier ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                      {format(new Date(pkg.receivedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(pkg.status)}`}>
                        {statusLabel(pkg.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {pkg.status === 'WAITING_PICKUP' && (
                          <>
                            <button
                              onClick={() => retrieveMutation.mutate(pkg.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-50"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Retirada
                            </button>
                            <button
                              onClick={() => returnMutation.mutate(pkg.id)}
                              className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                              title="Devolver"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {pkg.status === 'RETRIEVED' && pkg.retrievedByName && (
                          <span className="text-xs text-gray-500">por {pkg.retrievedByName}</span>
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

      {showForm && (
        <PackageFormModal
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            qc.invalidateQueries({ queryKey: ['packages'] });
          }}
        />
      )}
    </div>
  );
}

function PackageFormModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ unitId: '', recipientName: '', carrier: '', trackingCode: '', packageType: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: unitsData } = useQuery({ queryKey: ['units'], queryFn: () => unitsApi.list({ limit: 200 }) });
  const units = unitsData?.data ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await packagesApi.create(form);
      onSuccess();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erro ao registrar encomenda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">Registrar Encomenda</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Unidade *</label>
            <select
              required
              value={form.unitId}
              onChange={(e) => setForm({ ...form, unitId: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {units.map((u: any) => (
                <option key={u.id} value={u.id}>
                  {u.block ? `Bloco ${u.block} - ` : ''}{u.number}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Destinatário *</label>
            <input required type="text" value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nome do morador" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Transportadora</label>
              <input type="text" value={form.carrier}
                onChange={(e) => setForm({ ...form, carrier: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Correios, Sedex..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Código rastreio</label>
              <input type="text" value={form.trackingCode}
                onChange={(e) => setForm({ ...form, trackingCode: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Cancelar
            </button>
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
