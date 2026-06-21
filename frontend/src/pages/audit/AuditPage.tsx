import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '../../services/apiMethods';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AuditPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page],
    queryFn: () => auditApi.list({ page, limit: 50 }),
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;

  const actionLabel = (action: string) => ({
    CREATE: 'Criação', UPDATE: 'Atualização', DELETE: 'Exclusão',
    LOGIN: 'Login', LOGOUT: 'Logout', PERMISSION_CHANGE: 'Permissão',
  }[action] ?? action);

  const actionColor = (action: string) => ({
    CREATE: 'badge-green', UPDATE: 'badge-blue', DELETE: 'badge-red',
    LOGIN: 'badge-gray', LOGOUT: 'badge-gray',
  }[action] ?? 'badge-gray');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Auditoria</h1>
        <p className="text-gray-500 text-sm mt-1">Histórico de ações críticas no sistema</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Ação</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Entidade</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">IP</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Carregando...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12 text-gray-400">Nenhum registro de auditoria.</td></tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-medium text-xs">
                          {log.user?.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="text-gray-700">{log.user?.name ?? 'Sistema'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${actionColor(log.action)}`}>
                        {actionLabel(log.action)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell capitalize">
                      {log.entity}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs hidden md:table-cell">
                      {log.ip ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {format(new Date(log.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {total > 50 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">{total} registros no total</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                Anterior
              </button>
              <span className="px-3 py-1.5 text-sm text-gray-600">Pág. {page}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm disabled:opacity-40 hover:bg-gray-50">
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
