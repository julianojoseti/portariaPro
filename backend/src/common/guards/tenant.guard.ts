import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * TenantGuard enforces that every request only accesses data belonging
 * to the authenticated user's own company/condominium.
 *
 * companyId and condominiumId are ALWAYS sourced from the JWT payload —
 * never from the request body or query params.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Inject tenant context from JWT into request so services can use it
    request.tenantContext = {
      companyId: user.companyId,
      condominiumId: user.activeCondominiumId ?? null,
      userId: user.id,
      role: user.role,
    };

    // If there is a condominiumId in the route params or body, validate it
    const paramCondominiumId =
      request.params?.condominiumId || request.body?.condominiumId;

    if (paramCondominiumId && user.activeCondominiumId) {
      if (paramCondominiumId !== user.activeCondominiumId) {
        throw new ForbiddenException(
          'Acesso negado: condomínio fora do escopo do usuário',
        );
      }
    }

    return true;
  }
}
