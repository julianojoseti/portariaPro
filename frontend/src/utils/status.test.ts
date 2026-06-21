import { describe, it, expect } from 'vitest';
import { statusLabel, statusColor } from './status';

describe('statusLabel', () => {
  const labelCases: [string, string][] = [
    ['WAITING', 'Aguardando'],
    ['AUTHORIZED', 'Autorizado'],
    ['INSIDE', 'Dentro'],
    ['FINISHED', 'Finalizado'],
    ['DENIED', 'Negado'],
    ['OPEN', 'Aberta'],
    ['IN_ANALYSIS', 'Em análise'],
    ['RESOLVED', 'Resolvida'],
    ['RECEIVED', 'Recebida'],
    ['WAITING_PICKUP', 'Ag. retirada'],
    ['RETRIEVED', 'Retirada'],
    ['RETURNED', 'Devolvida'],
    ['ACTIVE', 'Ativo'],
    ['EXPIRED', 'Expirado'],
    ['CANCELLED', 'Cancelado'],
    ['LOW', 'Baixa'],
    ['MEDIUM', 'Média'],
    ['HIGH', 'Alta'],
    ['CRITICAL', 'Crítica'],
  ];

  it.each(labelCases)('maps "%s" to "%s"', (status, expected) => {
    expect(statusLabel(status)).toBe(expected);
  });

  it('returns the raw string for an unknown status', () => {
    expect(statusLabel('UNKNOWN_STATUS')).toBe('UNKNOWN_STATUS');
  });

  it('returns empty string when given empty string', () => {
    expect(statusLabel('')).toBe('');
  });
});

describe('statusColor', () => {
  const colorCases: [string, string][] = [
    ['WAITING', 'badge-yellow'],
    ['AUTHORIZED', 'badge-green'],
    ['INSIDE', 'badge-blue'],
    ['FINISHED', 'badge-gray'],
    ['DENIED', 'badge-red'],
    ['OPEN', 'badge-red'],
    ['IN_ANALYSIS', 'badge-yellow'],
    ['RESOLVED', 'badge-green'],
    ['RECEIVED', 'badge-blue'],
    ['WAITING_PICKUP', 'badge-yellow'],
    ['RETRIEVED', 'badge-green'],
    ['RETURNED', 'badge-gray'],
    ['ACTIVE', 'badge-green'],
    ['EXPIRED', 'badge-gray'],
    ['CANCELLED', 'badge-red'],
    ['LOW', 'badge-gray'],
    ['MEDIUM', 'badge-yellow'],
    ['HIGH', 'badge-red'],
    ['CRITICAL', 'badge-red'],
  ];

  it.each(colorCases)('maps "%s" to "%s"', (status, expected) => {
    expect(statusColor(status)).toBe(expected);
  });

  it('returns "badge-gray" for an unknown status', () => {
    expect(statusColor('UNKNOWN_STATUS')).toBe('badge-gray');
  });

  it('returns "badge-gray" for empty string', () => {
    expect(statusColor('')).toBe('badge-gray');
  });
});
