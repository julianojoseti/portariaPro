import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TenantGuard } from './tenant.guard';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

describe('TenantGuard', () => {
  let guard: TenantGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new TenantGuard(reflector);
  });

  function createMockContext(
    request: Record<string, any> = {},
  ): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;
  }

  describe('canActivate', () => {
    it('should return true for @Public() routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);
      const context = createMockContext();

      expect(guard.canActivate(context)).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);
    });

    it('should throw ForbiddenException when request.user is null', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const context = createMockContext({ user: null, params: {}, body: {} });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Usuário não autenticado',
      );
    });

    it('should inject tenantContext into request from user data', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = {
        user: {
          id: 'user-1',
          companyId: 'company-1',
          activeCondominiumId: 'condo-1',
          role: 'ADMIN',
        },
        params: {},
        body: {},
      };
      const context = createMockContext(request);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request['tenantContext']).toEqual({
        companyId: 'company-1',
        condominiumId: 'condo-1',
        userId: 'user-1',
        role: 'ADMIN',
      });
    });

    it('should throw ForbiddenException when params.condominiumId does not match user.activeCondominiumId', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = {
        user: {
          id: 'user-1',
          companyId: 'company-1',
          activeCondominiumId: 'condo-1',
          role: 'ADMIN',
        },
        params: { condominiumId: 'condo-999' },
        body: {},
      };
      const context = createMockContext(request);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Acesso negado: condomínio fora do escopo do usuário',
      );
    });

    it('should allow when no condominiumId in params', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = {
        user: {
          id: 'user-1',
          companyId: 'company-1',
          activeCondominiumId: 'condo-1',
          role: 'ADMIN',
        },
        params: {},
        body: {},
      };
      const context = createMockContext(request);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow when user.activeCondominiumId is null (no condo selected yet)', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = {
        user: {
          id: 'user-1',
          companyId: 'company-1',
          activeCondominiumId: null,
          role: 'ADMIN',
        },
        params: { condominiumId: 'condo-1' },
        body: {},
      };
      const context = createMockContext(request);

      // When activeCondominiumId is null the guard doesn't enforce the match
      expect(guard.canActivate(context)).toBe(true);
    });

    it('should also check body.condominiumId for mismatch', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = {
        user: {
          id: 'user-1',
          companyId: 'company-1',
          activeCondominiumId: 'condo-1',
          role: 'ADMIN',
        },
        params: {},
        body: { condominiumId: 'condo-999' },
      };
      const context = createMockContext(request);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow SUPER_ADMIN to bypass condominiumId validation', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
      const request = {
        user: {
          id: 'user-1',
          companyId: 'company-1',
          activeCondominiumId: 'condo-1',
          role: 'SUPER_ADMIN',
        },
        params: {},
        body: { condominiumId: 'condo-999' },
      };
      const context = createMockContext(request);

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});
