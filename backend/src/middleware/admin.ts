import { Request, Response, NextFunction } from 'express'
import { authMiddleware, requireRole, AuthenticatedRequest } from './authMiddleware'

export function adminMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  authMiddleware(req, res, (err?: any) => {
    if (err) return
    if (req.user && req.user.userType === 'admin') {
      return next()
    }
    return res.status(403).json({ message: 'Forbidden' })
  })
}

export const adminOnly = [authMiddleware, requireRole('admin')] as unknown as (
  (req: Request, res: Response, next: NextFunction) => void
)
