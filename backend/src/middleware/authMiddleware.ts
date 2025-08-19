import 'dotenv/config'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { apiResponse } from '../utils/responseFormatter'

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

// Helper functions per verificare il tipo di utente
export const isUtente = (req: AuthenticatedRequest) => req.user?.userType === 'privato'
export const isEnte = (req: AuthenticatedRequest) => req.user?.userType === 'ente'
export const isOperatore = (req: AuthenticatedRequest) => req.user?.userType === 'operatore'
export const isAmministratore = (req: AuthenticatedRequest) => req.user?.userType === 'admin'

// Middleware combinato per accesso admin
export const adminOnly = [authMiddleware, requireRole('admin')] as unknown as (
  (req: Request, res: Response, next: NextFunction) => void
)

// Middleware combinato per accesso operatore
export const operatoreOnly = [authMiddleware, requireRole('operatore')] as unknown as (
  (req: Request, res: Response, next: NextFunction) => void
)

// Middleware combinato per accesso operatore o admin
export const operatoreOrAdmin = [authMiddleware, requireRole('operatore', 'admin')] as unknown as (
  (req: Request, res: Response, next: NextFunction) => void
)

// Middleware combinato per accesso privato o ente
export const privatoOrEnte = [authMiddleware, requireRole('privato', 'ente')] as unknown as (
  (req: Request, res: Response, next: NextFunction) => void
)

// Middleware combinato per qualsiasi utente autenticato
export const anyAuth = [authMiddleware] as unknown as (
  (req: Request, res: Response, next: NextFunction) => void
)
