import { Injectable } from '@nestjs/common';
import { GalleryResponseDto, SessionResponseDto } from './dto/session-response.dto';

@Injectable()
export class SessionsCache {
  private readonly sessions = new Map<string, SessionResponseDto>();
  private readonly galleries = new Map<string, GalleryResponseDto>();

  setSession(token: string, data: SessionResponseDto): void {
    this.sessions.set(token, data);
  }
  getSession(token: string): SessionResponseDto | undefined {
    return this.sessions.get(token);
  }
  invalidateSession(token: string): void {
    this.sessions.delete(token);
  }

  setGallery(token: string, data: GalleryResponseDto): void {
    this.galleries.set(token, data);
  }
  getGallery(token: string): GalleryResponseDto | undefined {
    return this.galleries.get(token);
  }
  invalidateGallery(token: string): void {
    this.galleries.delete(token);
  }
}
