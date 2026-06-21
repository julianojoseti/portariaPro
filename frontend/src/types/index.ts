// API types for Portaria Pro
// Mirrors Prisma enums/models

export type Role =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'MANAGER'
  | 'DOORMAN'
  | 'RESIDENT'
  | 'EMPLOYEE';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  companyId: string;
  photoUrl?: string;
  activeCondominiumId?: string | null;
  mustChangePassword?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
  mustChangePassword: boolean;
  condominiums: { id: string; name: string }[];
}

export interface Condominium {
  id: string;
  companyId: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  isActive: boolean;
}

export interface Unit {
  id: string;
  condominiumId: string;
  block?: string;
  number: string;
  type: string;
  floor?: number;
  parkingSpots: number;
  isActive: boolean;
}

export type ResidentType = 'OWNER' | 'TENANT' | 'DEPENDENT' | 'DOMESTIC_EMPLOYEE';

export interface Resident {
  id: string;
  condominiumId: string;
  unitId: string;
  unit?: Unit;
  name: string;
  document?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  type: ResidentType;
  isActive: boolean;
  canAuthorizeVisitors: boolean;
}

export type AccessStatus = 'WAITING' | 'AUTHORIZED' | 'INSIDE' | 'FINISHED' | 'DENIED';
export type PersonType = 'VISITOR' | 'SERVICE_PROVIDER' | 'RESIDENT' | 'EMPLOYEE' | 'DELIVERY' | 'OTHER';

export interface AccessLog {
  id: string;
  condominiumId: string;
  unitId?: string;
  personType: PersonType;
  personName: string;
  personDocument?: string;
  vehiclePlate?: string;
  purpose?: string;
  photoUrl?: string;
  status: AccessStatus;
  entryAt?: string;
  exitAt?: string;
  deniedReason?: string;
  observations?: string;
  createdAt: string;
  visitor?: { id: string; name: string };
  serviceProvider?: { id: string; name: string };
  operator?: { id: string; name: string };
}

export type PackageStatus = 'RECEIVED' | 'WAITING_PICKUP' | 'RETRIEVED' | 'RETURNED';

export interface PackageDelivery {
  id: string;
  condominiumId: string;
  unitId: string;
  unit?: Unit;
  recipientName: string;
  carrier?: string;
  trackingCode?: string;
  packageType?: string;
  photoUrl?: string;
  status: PackageStatus;
  receivedAt: string;
  retrievedAt?: string;
  retrievedByName?: string;
}

export type OccurrenceStatus = 'OPEN' | 'IN_ANALYSIS' | 'RESOLVED';
export type OccurrencePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Occurrence {
  id: string;
  condominiumId: string;
  unitId?: string;
  unit?: Unit;
  type: string;
  title: string;
  description: string;
  priority: OccurrencePriority;
  status: OccurrenceStatus;
  reportedById: string;
  reportedBy?: { id: string; name: string };
  createdAt: string;
}

export interface Visitor {
  id: string;
  condominiumId: string;
  unitId: string;
  unit?: Unit;
  name: string;
  document?: string;
  phone?: string;
  photoUrl?: string;
  vehiclePlate?: string;
  purpose?: string;
  isRecurrent: boolean;
  validUntil?: string;
}

export interface ServiceProvider {
  id: string;
  condominiumId: string;
  name: string;
  company?: string;
  serviceType?: string;
  phone?: string;
  vehiclePlate?: string;
  isBlocked: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardSummary {
  insideNow: number;
  waitingAccess: number;
  pendingPackages: number;
  openOccurrences: number;
  todayEntries: number;
  recentAccess: AccessLog[];
}
