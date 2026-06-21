import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, Calendar } from 'lucide-react';
import { reportsApi } from '../../services/apiMethods';
import { format, subDays } from 'date-fns';

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeReport, setActiveReport] = useState<'access' | 'packages' | 'occurrences'>('access');

  const { data: accessData } = useQuery({
    queryKey: ['reports', 'access', dateFrom, dateTo],
    queryFn: () => reportsApi.accessByPeriod({ dateFrom, dateTo }),
    enabled: activeReport === 'access',
  });

  const { data: packagesData } = useQuery({
    queryKey: ['reports', 'packages', dateFrom, dateTo],
    queryFn: () => reportsApi.packages({ dateFrom, dateTo }),
    enabled: activeReport === 'packages',
  });

  const { data: occData } = useQuery({
    queryKey: ['reports', 'occurrences', dateFrom, dateTo],
    queryFn: () => reportsApi.occurrences({ dateFrom, dateTo }),
    enabled: activeReport === 'occurrences',
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
        <p className="text-gray-500 text-sm mt-1">Análises e estatísticas do condomínio</p>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <span className="text-gray-400">até</span>
        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Report tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'access' as const, label: 'Acessos' },
          { key: 'packages' as const, label: 'Encomendas' },
          { key: 'occurrences' as const, label: 'Ocorrências' },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setActiveReport(key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeReport === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Report cards */}
      {activeReport === 'access' && accessData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReportCard label="Total de entradas" value={accessData.entries} color="text-green-600 bg-green-50" />
          <ReportCard label="Saídas registradas" value={accessData.exits} color="text-orange-600 bg-orange-50" />
          <ReportCard label="Acessos negados" value={accessData.denied} color="text-red-600 bg-red-50" />
        </div>
      )}

      {activeReport === 'packages' && packagesData && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <ReportCard label="Recebidas" value={packagesData.received} color="text-blue-600 bg-blue-50" />
          <ReportCard label="Aguardando" value={packagesData.pending} color="text-yellow-600 bg-yellow-50" />
          <ReportCard label="Retiradas" value={packagesData.retrieved} color="text-green-600 bg-green-50" />
          <ReportCard label="Devolvidas" value={packagesData.returned} color="text-gray-600 bg-gray-100" />
        </div>
      )}

      {activeReport === 'occurrences' && occData && Array.isArray(occData) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {occData.map((item: any) => (
            <ReportCard key={item.status} label={item.status === 'OPEN' ? 'Abertas' : item.status === 'IN_ANALYSIS' ? 'Em análise' : 'Resolvidas'} value={item._count} color="text-gray-700 bg-gray-100" />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>
        <BarChart3 className="w-5 h-5" />
      </div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value ?? 0}</p>
    </div>
  );
}
