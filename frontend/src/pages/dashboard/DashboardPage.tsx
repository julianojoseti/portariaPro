import { useQuery } from '@tanstack/react-query';
import {
  Users, Package, AlertTriangle,
  TrendingUp, ArrowUpRight, Clock,
} from 'lucide-react';
import { dashboardApi } from '../../services/apiMethods';
import type { DashboardSummary } from '../../types';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { statusLabel, statusColor } from '../../utils/status';

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.getSummary,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const cards = [
    {
      label: 'Dentro agora',
      value: data?.insideNow ?? 0,
      icon: Users,
      color: 'text-green-600 bg-green-50',
      badge: 'badge-green',
    },
    {
      label: 'Aguardando acesso',
      value: data?.waitingAccess ?? 0,
      icon: Clock,
      color: 'text-yellow-600 bg-yellow-50',
      badge: 'badge-yellow',
    },
    {
      label: 'Encomendas pendentes',
      value: data?.pendingPackages ?? 0,
      icon: Package,
      color: 'text-blue-600 bg-blue-50',
      badge: 'badge-blue',
    },
    {
      label: 'Ocorrências abertas',
      value: data?.openOccurrences ?? 0,
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
      badge: 'badge-red',
    },
    {
      label: 'Entradas hoje',
      value: data?.todayEntries ?? 0,
      icon: TrendingUp,
      color: 'text-indigo-600 bg-indigo-50',
      badge: 'badge-gray',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral em tempo real do condomínio</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Recent access */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Últimas movimentações</h2>
          <a href="/access" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
        <div className="divide-y divide-gray-100">
          {data?.recentAccess?.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Nenhuma movimentação registrada.</p>
          )}
          {data?.recentAccess?.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                  {log.personName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{log.personName}</p>
                  <p className="text-xs text-gray-500">
                    {log.personType === 'VISITOR' ? 'Visitante' :
                      log.personType === 'SERVICE_PROVIDER' ? 'Prestador' :
                      log.personType === 'DELIVERY' ? 'Entrega' : log.personType}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(log.status)}`}>
                  {statusLabel(log.status)}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
