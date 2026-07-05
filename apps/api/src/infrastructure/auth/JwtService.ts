import jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/user/UserRole';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  type: 'user' | 'application';
  appName?: string;
}

export class JwtService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d',
  ) {}

  generateToken(
    payload: Omit<JwtPayload, 'type'> & { type?: 'user' | 'application' },
  ): string {
    const tokenPayload: Record<string, unknown> = {
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      type: payload.type || 'user',
    };
    if (payload.appName) {
      tokenPayload.appName = payload.appName;
    }
    return jwt.sign(tokenPayload, this.secret, { expiresIn: this.expiresIn as any });
  }

  verifyToken(token: string): JwtPayload {
    const decoded = jwt.verify(token, this.secret) as JwtPayload;
    return decoded;
  }
}
