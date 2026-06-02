import { createRequire } from 'node:module'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mockDb, saveMockDb } from '../mockData.js'

const require = createRequire(import.meta.url)
const AdmZip = require('adm-zip')
const cron = require('node-cron')

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BACKUP_DIR = path.resolve(__dirname, '../../backups')
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads')
const MOCK_DB_PATH = path.resolve(__dirname, '../../data/mock-db.json')
const MAX_BACKUPS = 20

fs.mkdirSync(BACKUP_DIR, { recursive: true })

let activeCronJob = null

const addDirToZip = (zip, dirPath, zipFolder) => {
  if (!fs.existsSync(dirPath)) return
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    const zipPath = zipFolder ? `${zipFolder}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      addDirToZip(zip, fullPath, zipPath)
    } else {
      zip.addLocalFile(fullPath, zipFolder || '')
    }
  }
}

export const createBackup = async () => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `bfet-backup-${timestamp}.zip`
  const filepath = path.join(BACKUP_DIR, filename)

  const zip = new AdmZip()

  // Full DB (includes password hashes — required for restore)
  if (fs.existsSync(MOCK_DB_PATH)) {
    zip.addLocalFile(MOCK_DB_PATH, '', 'db.json')
  }

  // All uploaded files
  if (fs.existsSync(UPLOADS_DIR)) {
    addDirToZip(zip, UPLOADS_DIR, 'uploads')
  }

  // Backup metadata
  const meta = JSON.stringify({
    version: 2,
    createdAt: new Date().toISOString(),
    platform: 'Ассоциация выпускников БФЭТ',
    schedule: mockDb.backupSchedule || 'weekly'
  }, null, 2)
  zip.addFile('backup-info.json', Buffer.from(meta, 'utf8'))

  zip.writeZip(filepath)

  const sizeBytes = fs.statSync(filepath).size

  pruneOldBackups()

  if (!mockDb.backupHistory) mockDb.backupHistory = []
  mockDb.backupHistory.unshift({ filename, createdAt: new Date().toISOString(), sizeBytes })
  if (mockDb.backupHistory.length > MAX_BACKUPS) {
    mockDb.backupHistory = mockDb.backupHistory.slice(0, MAX_BACKUPS)
  }
  mockDb.lastBackupAt = new Date().toISOString()
  saveMockDb()

  return { filename, sizeBytes }
}

export const listBackups = () => {
  if (!fs.existsSync(BACKUP_DIR)) return []
  return fs.readdirSync(BACKUP_DIR)
    .filter((f) => f.endsWith('.zip'))
    .map((f) => {
      const stat = fs.statSync(path.join(BACKUP_DIR, f))
      return { filename: f, sizeBytes: stat.size, createdAt: stat.birthtime.toISOString() }
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export const deleteBackup = (filename) => {
  const safe = path.basename(filename)
  if (!safe.endsWith('.zip') || !safe.startsWith('bfet-backup-')) {
    throw new Error('Недопустимое имя файла')
  }
  const filepath = path.join(BACKUP_DIR, safe)
  if (!fs.existsSync(filepath)) throw new Error('Файл не найден')
  fs.unlinkSync(filepath)
  if (mockDb.backupHistory) {
    mockDb.backupHistory = mockDb.backupHistory.filter((b) => b.filename !== safe)
    saveMockDb()
  }
}

export const getBackupFilePath = (filename) => {
  const safe = path.basename(filename)
  if (!safe.endsWith('.zip') || !safe.startsWith('bfet-backup-')) {
    throw new Error('Недопустимое имя файла')
  }
  const filepath = path.join(BACKUP_DIR, safe)
  if (!fs.existsSync(filepath)) throw new Error('Файл не найден')
  return filepath
}

const pruneOldBackups = () => {
  const files = listBackups()
  if (files.length > MAX_BACKUPS) {
    files.slice(MAX_BACKUPS).forEach(({ filename }) => {
      try { fs.unlinkSync(path.join(BACKUP_DIR, filename)) } catch {}
    })
  }
}

// ── Scheduler ───────────────────────────────────────────────────────────────

const CRON_EXPRESSIONS = {
  weekly:  '0 3 * * 0',
  monthly: '0 3 1 * *',
  daily:   '0 3 * * *'
}

export const applySchedule = (schedule) => {
  if (activeCronJob) {
    activeCronJob.stop()
    activeCronJob = null
  }

  mockDb.backupSchedule = schedule
  saveMockDb()

  if (schedule === 'disabled' || !CRON_EXPRESSIONS[schedule]) return

  activeCronJob = cron.schedule(CRON_EXPRESSIONS[schedule], async () => {
    console.log(`[Backup] Running scheduled backup (${schedule})…`)
    try {
      const result = await createBackup()
      console.log(`[Backup] Done: ${result.filename} (${(result.sizeBytes / 1024 / 1024).toFixed(2)} MB)`)
    } catch (err) {
      console.error('[Backup] Scheduled backup failed:', err.message)
    }
  }, { timezone: 'Asia/Bishkek' })

  console.log(`[Backup] Scheduler set to: ${schedule}`)
}

export const initBackupScheduler = () => {
  const schedule = mockDb.backupSchedule || 'weekly'
  applySchedule(schedule)
}

// ── Restore ─────────────────────────────────────────────────────────────────

export const restoreBackup = (zipBuffer) => {
  const zip = new AdmZip(zipBuffer)

  // Validate archive has db.json
  const dbEntry = zip.getEntry('db.json')
  if (!dbEntry) throw new Error('Архив не содержит db.json — это не резервная копия платформы')

  const dbContent = JSON.parse(zip.readAsText(dbEntry))
  if (!dbContent.users || !dbContent.alumni) {
    throw new Error('Файл db.json повреждён или имеет неверный формат')
  }

  // Write db.json to disk
  fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(dbContent, null, 2), 'utf8')

  // Update in-memory mockDb without server restart
  Object.keys(mockDb).forEach((key) => { delete mockDb[key] })
  Object.assign(mockDb, dbContent)

  // Restore uploads
  let filesRestored = 0
  zip.getEntries().forEach((entry) => {
    if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
      const relPath = entry.entryName.slice('uploads/'.length)
      const targetPath = path.join(UPLOADS_DIR, relPath)
      fs.mkdirSync(path.dirname(targetPath), { recursive: true })
      fs.writeFileSync(targetPath, entry.getData())
      filesRestored++
    }
  })

  return { usersCount: dbContent.users?.length || 0, alumniCount: dbContent.alumni?.length || 0, filesRestored }
}
