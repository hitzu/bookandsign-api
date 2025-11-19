import { TOKEN_TYPE } from '../../common/types/token-type';

export class DecodedTokenDto {
  sub: number;
  email: string;
  type: TOKEN_TYPE;
  exp: string;
  id: number;
}
