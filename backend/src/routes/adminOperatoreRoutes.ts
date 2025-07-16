import express from 'express'
import { adminOnly } from '../middleware/admin'
import { createOperatore, deleteOperatore } from '../controllers/operatoreController'

const router = express.Router()

router.use(adminOnly)
router.post('/', createOperatore)
router.delete('/:id', deleteOperatore)

export default router
