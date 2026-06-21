import {
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockResponse: Record<string, any>;
  let mockRequest: Record<string, any>;

  beforeEach(() => {
    filter = new GlobalExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = { status: mockStatus };
    mockRequest = { url: '/api/test' };
  });

  function createMockHost(): ArgumentsHost {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
        getNext: () => jest.fn(),
      }),
      getArgs: () => [],
      getArgByIndex: () => null,
      switchToRpc: () => ({} as any),
      switchToWs: () => ({} as any),
      getType: () => 'http' as any,
    } as ArgumentsHost;
  }

  it('should handle HttpException with correct status and message', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Not Found',
      }),
    );
  });

  it('should extract message and code from HttpException with object response', () => {
    const exception = new HttpException(
      { message: 'Recurso nao encontrado', code: 'RESOURCE_NOT_FOUND' },
      HttpStatus.NOT_FOUND,
    );
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.NOT_FOUND,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Recurso nao encontrado',
      }),
    );
  });

  it('should return 500 with safe message for generic Error', () => {
    const exception = new Error('Some internal DB error with secrets');
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      }),
    );
  });

  it('should preserve validation errors (array message)', () => {
    const exception = new BadRequestException({
      message: ['email must be an email', 'name should not be empty'],
      error: 'Bad Request',
    });
    const host = createMockHost();

    filter.catch(exception, host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['email must be an email', 'name should not be empty'],
      }),
    );
  });

  it('should include correct response body shape', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
    const host = createMockHost();

    // Fix the date so we can assert on timestamp format
    const now = new Date('2026-01-01T00:00:00.000Z');
    jest.useFakeTimers();
    jest.setSystemTime(now);

    filter.catch(exception, host);

    const body = mockJson.mock.calls[0][0];

    expect(body).toEqual({
      success: false,
      statusCode: HttpStatus.BAD_REQUEST,
      code: expect.any(String),
      message: expect.anything(),
      timestamp: now.toISOString(),
      path: '/api/test',
    });

    jest.useRealTimers();
  });

  it('should handle non-Error unknown exceptions gracefully', () => {
    const host = createMockHost();

    // Passing a string as exception (edge case)
    filter.catch('unexpected string error', host);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
      }),
    );
  });
});
