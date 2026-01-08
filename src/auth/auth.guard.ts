import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { TokenService } from '../tokens/token.service';
import { DecodedTokenDto } from '../tokens/dto/decode-token.dto';
import { IS_PUBLIC_KEY } from './decorators/public.decorator';

export interface AuthenticatedRequest extends Request {
  user: DecodedTokenDto;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly reflector: Reflector,
  ) {}

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (isPublic) {
      const token = this.extractTokenFromHeader(request);
      if (token) {
        try {
          await this.tokenService.verifyToken(token);
          request.user = this.tokenService.decodeToken(token);
        } catch {
          // Public routes should not fail when the bearer token is missing/invalid.
        }
      }
      return true;
    }

    try {
      const token = this.extractTokenFromHeader(request);
      if (!token) {
        throw new UnauthorizedException();
      }
      await this.tokenService.verifyToken(token);

      request.user = this.tokenService.decodeToken(token);
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
