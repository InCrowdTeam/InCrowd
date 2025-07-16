import express from 'express'
import { adminMiddleware } from '../middleware/admin'
import { createOperatore, updateOperatore, deleteOperatore, getAllOperatori } from '../controllers/operatoreController'

const router = express.Router()

router.use(adminMiddleware)
router.get('/', getAllOperatori)
router.post('/', createOperatore)
router.put('/:id', updateOperatore)
router.delete('/:id', deleteOperatore)

export default router
