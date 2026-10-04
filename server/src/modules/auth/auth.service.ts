import crypto from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { dbPool } from '../../db/client.js';
import { UnauthorizedError } from '../../lib/errors.js';
import { RegisterInput, LoginInput, RefreshInput } from './auth.schema.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface UserResponse {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  user: UserResponse;
  tokens: AuthTokens;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  public static async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await dbPool.query<{ id: string }>('SELECT id FROM users WHERE email = $1;', [
      input.email,
    ]);
    if (existing.rows.length > 0) {
      // Use generic error or conflict without user enumeration
      throw new UnauthorizedError('Unable to register with provided credentials');
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
    });

    const res = await dbPool.query<{ id: string; email: string; created_at: Date }>(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, created_at;`,
      [input.email, passwordHash],
    );

    const user = res.rows[0];
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at.toISOString(),
      },
      tokens,
    };
  }

  public static async login(input: LoginInput): Promise<AuthResult> {
    const res = await dbPool.query<{
      id: string;
      email: string;
      password_hash: string;
      created_at: Date;
    }>('SELECT id, email, password_hash, created_at FROM users WHERE email = $1;', [input.email]);

    if (res.rows.length === 0) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const user = res.rows[0];
    const isPasswordValid = await argon2.verify(user.password_hash, input.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        createdAt: user.created_at.toISOString(),
      },
      tokens,
    };
  }

  public static async refresh(input: RefreshInput): Promise<AuthTokens> {
    const tokenHash = hashToken(input.refreshToken);

    const res = await dbPool.query<{
      id: string;
      user_id: string;
      email: string;
      revoked: boolean;
      expires_at: Date;
    }>(
      `SELECT rt.id, rt.user_id, u.email, rt.revoked, rt.expires_at
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token_hash = $1;`,
      [tokenHash],
    );

    if (res.rows.length === 0) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const tokenRecord = res.rows[0];

    if (tokenRecord.revoked || new Date() > tokenRecord.expires_at) {
      // Revoke all tokens for this user if a revoked token is reused (token reuse detection)
      await dbPool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1;', [
        tokenRecord.user_id,
      ]);
      throw new UnauthorizedError('Refresh token revoked or expired');
    }

    // Revoke old token as part of rotation
    await dbPool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE id = $1;', [tokenRecord.id]);

    // Issue fresh pair
    return this.generateTokens(tokenRecord.user_id, tokenRecord.email);
  }

  public static async logout(refreshToken: string): Promise<void> {
    const tokenHash = hashToken(refreshToken);
    await dbPool.query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1;', [
      tokenHash,
    ]);
  }

  private static async generateTokens(userId: string, email: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      {
        sub: userId,
        email,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: '15m',
      },
    );

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await dbPool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3);`,
      [userId, tokenHash, expiresAt],
    );

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    };
  }
}
