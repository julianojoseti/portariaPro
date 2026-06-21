import { api } from './api';
import type { AuthResponse } from '../types';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),

  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }).then((r) => r.data),

  selectCondominium: (condominiumId: string) =>
    api.post('/auth/select-condominium', { condominiumId }).then((r) => r.data),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),

  me: () => api.get('/auth/me').then((r) => r.data),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  getSummary: () => api.get('/dashboard').then((r) => r.data),
};

// ── Condominiums ──────────────────────────────────────────────
export const condominiumsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/condominiums', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/condominiums/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/condominiums', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/condominiums/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/condominiums/${id}`).then((r) => r.data),
};

// ── Units ─────────────────────────────────────────────────────
export const unitsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/units', { params }).then((r) => r.data),
  blocks: () => api.get('/units/blocks').then((r) => r.data),
  get: (id: string) => api.get(`/units/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/units', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/units/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/units/${id}`).then((r) => r.data),
};

// ── Residents ─────────────────────────────────────────────────
export const residentsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/residents', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/residents/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/residents', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/residents/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/residents/${id}`).then((r) => r.data),
};

// ── Access Logs ───────────────────────────────────────────────
export const accessLogsApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/access-logs', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/access-logs/${id}`).then((r) => r.data),
  inside: () => api.get('/access-logs/inside').then((r) => r.data),
  dashboard: () => api.get('/access-logs/dashboard').then((r) => r.data),
  registerEntry: (data: Record<string, unknown>) =>
    api.post('/access-logs/entry', data).then((r) => r.data),
  registerExit: (id: string) =>
    api.patch(`/access-logs/${id}/exit`).then((r) => r.data),
  authorize: (id: string) =>
    api.patch(`/access-logs/${id}/authorize`).then((r) => r.data),
  deny: (id: string, reason: string) =>
    api.patch(`/access-logs/${id}/deny`, { reason }).then((r) => r.data),
};

// ── Packages ──────────────────────────────────────────────────
export const packagesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/packages', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/packages/${id}`).then((r) => r.data),
  pendingCount: () => api.get('/packages/pending-count').then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/packages', data).then((r) => r.data),
  retrieve: (id: string, data: Record<string, unknown>) =>
    api.patch(`/packages/${id}/retrieve`, data).then((r) => r.data),
  markReturned: (id: string) =>
    api.patch(`/packages/${id}/return`).then((r) => r.data),
};

// ── Occurrences ───────────────────────────────────────────────
export const occurrencesApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/occurrences', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/occurrences/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/occurrences', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/occurrences/${id}`, data).then((r) => r.data),
  addComment: (id: string, content: string) =>
    api.post(`/occurrences/${id}/comments`, { content }).then((r) => r.data),
};

// ── Users ─────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/users', { params }).then((r) => r.data),
  get: (id: string) => api.get(`/users/${id}`).then((r) => r.data),
  create: (data: Record<string, unknown>) =>
    api.post('/users', data).then((r) => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`).then((r) => r.data),
};

// ── Reports ───────────────────────────────────────────────────
export const reportsApi = {
  accessByPeriod: (params: Record<string, unknown>) =>
    api.get('/reports/access-by-period', { params }).then((r) => r.data),
  packages: (params: Record<string, unknown>) =>
    api.get('/reports/packages', { params }).then((r) => r.data),
  occurrences: (params: Record<string, unknown>) =>
    api.get('/reports/occurrences', { params }).then((r) => r.data),
};

// ── Audit ─────────────────────────────────────────────────────
export const auditApi = {
  list: (params?: Record<string, unknown>) =>
    api.get('/audit', { params }).then((r) => r.data),
};
