import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Pool } from 'pg';
import { JwtPayload } from '../../common/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject('DATABASE_POOL') private db: Pool) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'change-this-secret',
    });
  }

  async validate(payload: JwtPayload) {
    // Optional: Verify user still exists and is active
    const result = await this.db.query(
      'SELECT id, email, role, is_verified FROM users WHERE id = $1',
      [payload.sub],
    );

    if (result.rows.length === 0) {
      return null;
    }

    return payload;
  }
}
