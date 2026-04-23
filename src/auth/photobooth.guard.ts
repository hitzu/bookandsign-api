import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PHOTOBOOTH_KEY } from './decorators/photobooth.decorator';

const PHOTOBOOTH_API_KEY = 'brillipoint-photobooth-key';

@Injectable()
export class PhotoboothGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPhotobooth = this.reflector.getAllAndOverride<boolean>(IS_PHOTOBOOTH_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!isPhotobooth) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const key = req.headers['x-photobooth-key'];

    if (key !== PHOTOBOOTH_API_KEY) {
      throw new UnauthorizedException('Invalid or missing photobooth key');
    }

    return true;
  }
}
