import express from 'express'
import multer from 'multer'
import { z } from 'zod'
import { authMiddleware, requireRole } from '../middleware/auth.js'
import { asyncHandler, AppError } from '../middleware/errorHandler.js'
import { mockDb } from '../mockData.js'
import {
  createBackup,
  listBackups,
  deleteBackup,
  getBackupFilePath,
  applySchedule,
  restoreBackup
} from '../services/backupService.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } })

const router = express.Router()

const scheduleSchema = z.object({
  schedule: z.enum(['daily', 'weekly', 'monthly', 'disabled'])
})

// Get status: schedule setting + list of backup files
router.get(
  '/status',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    res.json({
      schedule: mockDb.backupSchedule || 'weekly',
      lastBackupAt: mockDb.lastBackupAt || null,
      backups: listBackups()
    })
  })
)

// Trigger manual backup
router.post(
  '/create',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const result = await createBackup()
    res.status(201).json({ message: 'Резервная копия создана', ...result })
  })
)

// Download a backup file
router.get(
  '/download/:filename',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const filepath = getBackupFilePath(req.params.filename)
    res.download(filepath, req.params.filename)
  })
)

// Delete a backup file
router.delete(
  '/:filename',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    deleteBackup(req.params.filename)
    res.json({ message: 'Резервная копия удалена' })
  })
)

// Restore from uploaded ZIP
router.post(
  '/restore',
  authMiddleware,
  requireRole('ADMIN'),
  upload.single('backup'),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError('Файл не загружен', 400)
    if (!req.file.originalname.endsWith('.zip')) throw new AppError('Допускается только ZIP-архив', 400)
    const result = restoreBackup(req.file.buffer)
    res.json({
      message: 'Платформа успешно восстановлена из резервной копии',
      ...result
    })
  })
)

// Update backup schedule
router.put(
  '/schedule',
  authMiddleware,
  requireRole('ADMIN'),
  asyncHandler(async (req, res) => {
    const { schedule } = scheduleSchema.parse(req.body)
    applySchedule(schedule)
    res.json({ message: 'Расписание обновлено', schedule })
  })
)

export default router
