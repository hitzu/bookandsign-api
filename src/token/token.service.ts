import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Token } from './entities/token.entity';
import { Repository } from 'typeorm';
import { User } from '../user/entities/user.entity';
import { TOKEN_TYPE } from '../common/types/token-type';
import { TOKEN_CONFIG } from '../config/token/token.config';
import { accessAndRefreshTokenDto } from './dto/access-refresh-token.dto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly jwtService: JwtService,
  ) {}

  private async generateJwtToken(
    user: User,
    expiresIn: string,
    type: TOKEN_TYPE,
  ): Promise<string> {
    const payload = { sub: user.id, email: user.email, type };
    return this.jwtService.signAsync(payload);
  }

  public async generateAuthTokens(
    user: User,
  ): Promise<accessAndRefreshTokenDto> {
    const accessToken = await this.generateJwtToken(
      user,
      `${TOKEN_CONFIG.EXP.accessTokenExp}d`,
      TOKEN_TYPE.ACCESS,
    );
    await this.tokenRepository.delete({ user: { id: user.id } });

    const accessTokenEntity = this.tokenRepository.create({
      token: accessToken,
      user,
      type: TOKEN_TYPE.ACCESS,
    });
    await this.tokenRepository.save(accessTokenEntity);

    const refreshToken = await this.generateJwtToken(
      user,
      TOKEN_CONFIG.EXP.refreshTokenExp,
      TOKEN_TYPE.REFRESH,
    );
    const refreshTokenEntity = this.tokenRepository.create({
      token: refreshToken,
      user,
      type: TOKEN_TYPE.REFRESH,
    });
    await this.tokenRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }
}
