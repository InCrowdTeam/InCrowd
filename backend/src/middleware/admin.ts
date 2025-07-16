import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'supersegreto'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com'

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header) return res.status(401).json({ message: 'Unauthorized' })
  const token = header.replace('Bearer ', '')
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any
    if (payload.userType === 'admin' && payload.email === ADMIN_EMAIL) {
      return next()
    }
    return res.status(401).json({ message: 'Unauthorized' })
  } catch {
    return res.status(401).json({ message: 'Unauthorized' })
  }
}
