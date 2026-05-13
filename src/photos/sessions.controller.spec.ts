import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test, type TestingModule } from '@nestjs/testing';

import { AuthGuard } from '../auth/auth.guard';
import type { AuthenticatedRequest } from '../auth/auth.guard';
import { TOKEN_TYPE } from '../common/types/token-type';
import type { DecodedTokenDto } from '../tokens/dto/decode-token.dto';
import { TokenService } from '../tokens/token.service';
import { SessionsController } from './sessions.controller';
import { SessionsService } from './sessions.service';

describe('SessionsController', () => {
  let controller: SessionsController;
  let authGuard: AuthGuard;
  let clearCacheMock: jest.MockedFunction<SessionsService['clearCache']>;
  let verifyTokenMock: jest.MockedFunction<TokenService['verifyToken']>;
  let decodeTokenMock: jest.MockedFunction<TokenService['decodeToken']>;

  beforeEach(async () => {
    clearCacheMock = jest.fn();
    verifyTokenMock = jest.fn();
    decodeTokenMock = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionsController],
      providers: [
        {
          provide: SessionsService,
          useValue: {
            clearCache: clearCacheMock,
          } satisfies Pick<SessionsService, 'clearCache'>,
        },
        {
          provide: TokenService,
          useValue: {
            verifyToken: verifyTokenMock,
            decodeToken: decodeTokenMock,
          } satisfies Pick<TokenService, 'verifyToken' | 'decodeToken'>,
        },
        {
          provide: AuthGuard,
          useClass: AuthGuard,
        },
        {
          provide: APP_GUARD,
          useExisting: AuthGuard,
        },
      ],
    }).compile();

    controller = module.get<SessionsController>(SessionsController);
    authGuard = module.get<AuthGuard>(AuthGuard);
  });

  it('should reject cache clearing requests without a bearer token', async () => {
    const request = {
      headers: {},
    } as AuthenticatedRequest;
    const context = createHttpExecutionContext(request, controller.clearCache);

    await expect(authGuard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should allow authenticated requests to clear the sessions cache', async () => {
    const decodedToken: DecodedTokenDto = {
      sub: 1,
      email: 'ops@example.com',
      type: TOKEN_TYPE.ACCESS,
      exp: Math.floor(Date.now() / 1000) + 3600,
      id: 1,
    };
    const request = {
      headers: {
        authorization: 'Bearer valid-token',
      },
    } as AuthenticatedRequest;
    const context = createHttpExecutionContext(request, controller.clearCache);

    verifyTokenMock.mockResolvedValue(undefined);
    decodeTokenMock.mockReturnValue(decodedToken);
    clearCacheMock.mockReturnValue({
      ok: true,
      cleared: {
        sessions: 2,
        galleries: 1,
      },
    });

    await expect(authGuard.canActivate(context)).resolves.toBe(true);
    expect(controller.clearCache()).toEqual({
      ok: true,
      cleared: {
        sessions: 2,
        galleries: 1,
      },
    });
    expect(verifyTokenMock).toHaveBeenCalledWith('valid-token');
    expect(clearCacheMock).toHaveBeenCalledTimes(1);
    expect(request.user).toEqual(decodedToken);
  });
});

function createHttpExecutionContext(
  request: AuthenticatedRequest,
  handler: SessionsController['clearCache'],
): ExecutionContext {
  return {
    getHandler: jest.fn(() => handler),
    getClass: jest.fn(() => SessionsController),
    switchToHttp: jest.fn(() => ({
      getRequest: () => request,
    })),
  } as unknown as ExecutionContext;
}
