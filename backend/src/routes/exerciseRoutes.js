import express from 'express'
import { getExercisesByDate, upsertExercisesByDate, createExercises, deleteExercisesByDate } from '../controllers/exerciseController.js'
import requireAuth from '../middleware/requireAuth.js'

const router = express.Router()

router.get('/date/:date', requireAuth, getExercisesByDate)
router.post('/', requireAuth, createExercises)
router.put('/date/:date', requireAuth, upsertExercisesByDate)
router.delete('/date/:date', requireAuth, deleteExercisesByDate)

export default router
