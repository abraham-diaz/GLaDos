import { timingSafeEqual } from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config';

export interface TokenPayload {
  username: string;
  iat: number;
  exp: number;
}

class AuthService {
  /**
   * Validates username and password
   */
  validateCredentials(username: string, password: string): boolean {
    const validUsername = config.auth.username;
    const validPassword = config.auth.password;

    // Use timing-safe comparison to prevent timing attacks
    const usernameBuffer = Buffer.from(username);
    const validUsernameBuffer = Buffer.from(validUsername);
    const passwordBuffer = Buffer.from(password);
    const validPasswordBuffer = Buffer.from(validPassword);

    const usernameMatch =
      usernameBuffer.length === validUsernameBuffer.length &&
      timingSafeEqual(usernameBuffer, validUsernameBuffer);

    const passwordMatch =
      passwordBuffer.length === validPasswordBuffer.length &&
      timingSafeEqual(passwordBuffer, validPasswordBuffer);

    return usernameMatch && passwordMatch;
  }

  /**
   * Generates a JWT token
   */
  generateToken(username: string): string {
    const options: SignOptions = {
      expiresIn: config.auth.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    };
    return jwt.sign({ username }, config.auth.jwtSecret, options);
  }

  /**
   * Verifies a JWT token
   */
  verifyToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, config.auth.jwtSecret) as TokenPayload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
