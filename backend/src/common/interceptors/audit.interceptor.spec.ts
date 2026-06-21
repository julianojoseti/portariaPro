import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';

describe('AuditInterceptor', () => {
  let interceptor: AuditInterceptor;
  let mockPrisma: { auditLog: { create: jest.Mock } };

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn().mockResolvedValue({}),
      },
    };
    interceptor = new AuditInterceptor(mockPrisma as any);
  });

  function createMockContext(
    request: Record<string, any>,
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

  function createMockCallHandler(responseData: any = {}): CallHandler {
    return { handle: () => of(responseData) } as CallHandler;
  }

  function createAuthenticatedRequest(
    method: string,
    path: string,
    overrides: Record<string, any> = {},
  ): Record<string, any> {
    return {
      method,
      path,
      headers: {
        'user-agent': 'test-agent',
      },
      socket: { remoteAddress: '127.0.0.1' },
      user: { id: 'user-1' },
      tenantContext: {
        companyId: 'company-1',
        condominiumId: 'condo-1',
        userId: 'user-1',
        role: 'ADMIN',
      },
      ...overrides,
    };
  }

  describe('POST requests', () => {
    it('should create audit log with action CREATE', async () => {
      const responseData = { id: 'new-id', name: 'Test' };
      const request = createAuthenticatedRequest('POST', '/api/residents');
      const context = createMockContext(request);
      const callHandler = createMockCallHandler(responseData);

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      // Allow the microtask (async tap) to complete
      await new Promise((r) => setTimeout(r, 0));

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: 'company-1',
          condominiumId: 'condo-1',
          userId: 'user-1',
          entity: 'residents',
          entityId: 'new-id',
          action: 'CREATE',
          afterData: responseData,
          ip: '127.0.0.1',
          userAgent: 'test-agent',
        }),
      });
    });
  });

  describe('PUT/PATCH requests', () => {
    it('should create audit log with action UPDATE for PUT', async () => {
      const responseData = { id: '123', name: 'Updated' };
      const request = createAuthenticatedRequest('PUT', '/api/residents/123');
      const context = createMockContext(request);
      const callHandler = createMockCallHandler(responseData);

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);
      await new Promise((r) => setTimeout(r, 0));

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE',
          entity: 'residents',
          entityId: '123',
          afterData: responseData,
        }),
      });
    });

    it('should create audit log with action UPDATE for PATCH', async () => {
      const responseData = { id: '456', name: 'Patched' };
      const request = createAuthenticatedRequest('PATCH', '/api/units/456');
      const context = createMockContext(request);
      const callHandler = createMockCallHandler(responseData);

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);
      await new Promise((r) => setTimeout(r, 0));

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'UPDATE',
          entity: 'units',
          entityId: '456',
        }),
      });
    });
  });

  describe('DELETE requests', () => {
    it('should create audit log with action DELETE', async () => {
      const request = createAuthenticatedRequest(
        'DELETE',
        '/api/residents/789',
      );
      const context = createMockContext(request);
      const callHandler = createMockCallHandler({});

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);
      await new Promise((r) => setTimeout(r, 0));

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'DELETE',
          entity: 'residents',
          entityId: '789',
          afterData: undefined,
        }),
      });
    });
  });

  describe('GET requests', () => {
    it('should skip audit logging and pass through for GET requests', async () => {
      const request = createAuthenticatedRequest('GET', '/api/residents');
      const context = createMockContext(request);
      const responseData = [{ id: '1' }];
      const callHandler = createMockCallHandler(responseData);

      const result$ = interceptor.intercept(context, callHandler);
      const result = await lastValueFrom(result$);

      expect(result).toEqual(responseData);
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('unauthenticated requests', () => {
    it('should skip when no user on request', async () => {
      const request = {
        method: 'POST',
        path: '/api/residents',
        headers: {},
        socket: {},
        user: null,
        tenantContext: null,
      };
      const context = createMockContext(request);
      const callHandler = createMockCallHandler({ id: '1' });

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should skip when no tenantContext on request', async () => {
      const request = {
        method: 'POST',
        path: '/api/residents',
        headers: {},
        socket: {},
        user: { id: 'user-1' },
        tenantContext: null,
      };
      const context = createMockContext(request);
      const callHandler = createMockCallHandler({ id: '1' });

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);

      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });
  });

  describe('entity extraction from URL', () => {
    it('should extract entity name from URL path (/api/residents/123 -> "residents")', async () => {
      const request = createAuthenticatedRequest(
        'DELETE',
        '/api/residents/123',
      );
      const context = createMockContext(request);
      const callHandler = createMockCallHandler({});

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);
      await new Promise((r) => setTimeout(r, 0));

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          entity: 'residents',
          entityId: '123',
        }),
      });
    });
  });

  describe('error resilience', () => {
    it('should never throw even if prisma.auditLog.create fails', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(
        new Error('DB connection lost'),
      );

      const responseData = { id: 'new-id', name: 'Test' };
      const request = createAuthenticatedRequest('POST', '/api/residents');
      const context = createMockContext(request);
      const callHandler = createMockCallHandler(responseData);

      const result$ = interceptor.intercept(context, callHandler);
      // Should not throw despite prisma failure
      const result = await lastValueFrom(result$);

      // Wait for the async tap to settle
      await new Promise((r) => setTimeout(r, 0));

      expect(result).toEqual(responseData);
    });
  });

  describe('IP extraction', () => {
    it('should use x-forwarded-for header when available', async () => {
      const request = createAuthenticatedRequest('POST', '/api/residents', {
        headers: {
          'x-forwarded-for': '10.0.0.1, 192.168.1.1',
          'user-agent': 'test-agent',
        },
      });
      const context = createMockContext(request);
      const callHandler = createMockCallHandler({ id: '1' });

      const result$ = interceptor.intercept(context, callHandler);
      await lastValueFrom(result$);
      await new Promise((r) => setTimeout(r, 0));

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ip: '10.0.0.1',
        }),
      });
    });
  });
});
