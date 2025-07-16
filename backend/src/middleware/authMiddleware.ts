import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET as string
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined')
}

export interface AuthenticatedRequest extends Request {
  user?: any
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Unauthorized' })
  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    req.user = payload
    next()
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' })
    if (roles.includes(req.user.userType)) {
      return next()
    }
    return res.status(403).json({ message: 'Forbidden' })
  }
}

export const isUtente = (req: AuthenticatedRequest) => req.user?.userType === 'user'
export const isEnte = (req: AuthenticatedRequest) => req.user?.userType === 'ente'
export const isOperatore = (req: AuthenticatedRequest) => req.user?.userType === 'operatore'
export const isAmministratore = (req: AuthenticatedRequest) => req.user?.userType === 'admin'
