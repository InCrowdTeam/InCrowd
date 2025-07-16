import express from 'express'
import { adminOnly } from '../middleware/admin'
import { createOperatore, updateOperatore, deleteOperatore, getAllOperatori } from '../controllers/operatoreController'

const router = express.Router()

router.use(adminOnly)
router.get('/', getAllOperatori)
router.post('/', createOperatore)
router.put('/:id', updateOperatore)
router.delete('/:id', deleteOperatore)

export default router
