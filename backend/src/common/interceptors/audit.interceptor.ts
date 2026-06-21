import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'ACCESS_DENIED' | string;

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method;

    const auditActions: Record<string, AuditAction> = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = auditActions[method];
    if (!action) return next.handle();

    const user = (request as any).user;
    const tenantCtx = (request as any).tenantContext;

    if (!user || !tenantCtx) return next.handle();

    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      request.socket?.remoteAddress ||
      'unknown';

    const userAgent = request.headers['user-agent'] || 'unknown';

    return next.handle().pipe(
      tap(async (responseData) => {
        try {
          // Extract entity from URL path  e.g. /api/residents/123 → "residents"
          const pathParts = request.path.replace(/^\/api\//, '').split('/');
          const entity = pathParts[0] ?? 'unknown';
          const entityId =
            method === 'DELETE' || method === 'PUT' || method === 'PATCH'
              ? pathParts[1] ?? null
              : responseData?.id ?? null;

          await this.prisma.auditLog.create({
            data: {
              companyId: tenantCtx.companyId,
              condominiumId: tenantCtx.condominiumId ?? undefined,
              userId: user.id,
              entity,
              entityId,
              action,
              afterData:
                action === 'CREATE' || action === 'UPDATE'
                  ? responseData
                  : undefined,
              ip,
              userAgent,
            },
          });
        } catch {
          // Audit failures must never break the main request
        }
      }),
    );
  }
}
