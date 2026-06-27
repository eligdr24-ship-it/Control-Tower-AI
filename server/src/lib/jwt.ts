import jwt from 'jsonwebtoken'
import { config } from '../config/env'

export interface JwtPayload {
  sub: string         // userId
  email: string
  orgId: string       // active organization
  role: string
  iat?: number
  exp?: number
}

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.JWT_SECRET) as JwtPayload
}
