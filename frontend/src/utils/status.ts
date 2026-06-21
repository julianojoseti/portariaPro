export function statusLabel(status: string): string {
  const map: Record<string, string> = {
    WAITING: 'Aguardando',
    AUTHORIZED: 'Autorizado',
    INSIDE: 'Dentro',
    FINISHED: 'Finalizado',
    DENIED: 'Negado',
    OPEN: 'Aberta',
    IN_ANALYSIS: 'Em análise',
    RESOLVED: 'Resolvida',
    RECEIVED: 'Recebida',
    WAITING_PICKUP: 'Ag. retirada',
    RETRIEVED: 'Retirada',
    RETURNED: 'Devolvida',
    ACTIVE: 'Ativo',
    EXPIRED: 'Expirado',
    CANCELLED: 'Cancelado',
    LOW: 'Baixa',
    MEDIUM: 'Média',
    HIGH: 'Alta',
    CRITICAL: 'Crítica',
  };
  return map[status] ?? status;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    WAITING: 'badge-yellow',
    AUTHORIZED: 'badge-green',
    INSIDE: 'badge-blue',
    FINISHED: 'badge-gray',
    DENIED: 'badge-red',
    OPEN: 'badge-red',
    IN_ANALYSIS: 'badge-yellow',
    RESOLVED: 'badge-green',
    RECEIVED: 'badge-blue',
    WAITING_PICKUP: 'badge-yellow',
    RETRIEVED: 'badge-green',
    RETURNED: 'badge-gray',
    ACTIVE: 'badge-green',
    EXPIRED: 'badge-gray',
    CANCELLED: 'badge-red',
    LOW: 'badge-gray',
    MEDIUM: 'badge-yellow',
    HIGH: 'badge-red',
    CRITICAL: 'badge-red',
  };
  return map[status] ?? 'badge-gray';
}
