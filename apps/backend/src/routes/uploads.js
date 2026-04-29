import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import multer from 'multer'
import { authMiddleware } from '../middleware/auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadRoot = path.resolve(__dirname, '../../uploads')

const allowedFolders = new Set(['documents', 'images', 'cv', 'misc'])
const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv'
])

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = allowedFolders.has(req.params.folder) ? req.params.folder : 'misc'
    const destination = path.join(uploadRoot, folder)
    fs.mkdirSync(destination, { recursive: true })
    cb(null, destination)
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const safeBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]+/g, '-').slice(0, 60) || 'file'
    cb(null, `${Date.now()}-${safeBase}${ext}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      cb(new Error('Недопустимый тип файла'))
      return
    }
    cb(null, true)
  }
})

const router = express.Router()

router.post('/:folder', authMiddleware, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' })
  const folder = allowedFolders.has(req.params.folder) ? req.params.folder : 'misc'
  res.status(201).json({
    originalName: req.file.originalname,
    filename: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    url: `/uploads/${folder}/${req.file.filename}`
  })
})

export default router
