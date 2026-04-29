import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const isPrismaUnavailable = (error) => {
  const text = `${error?.name || ''} ${error?.code || ''} ${error?.message || ''}`
  return /Prisma|P100|P101|Can't reach database|denied access|database server|ECONNREFUSED/i.test(text)
}

export const clone = (value) => JSON.parse(JSON.stringify(value))

export const localized = (ru, ky = ru, en = ru) => ({ ru, ky, en })

const defaultMockDb = {
  users: [
    {
      id: 'dev-admin',
      email: 'admin@alumni.local',
      passwordHash: '$2b$10$y4SCX8sE2ouMEg5cNIb./Oadrmo7P5pQxxISvHuZawrz6E6XNuMLO',
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2026-04-29T03:00:00.000Z',
      profile: {
        id: 'dev-admin-profile',
        fullName: 'Администратор БФЭТ',
        status: 'APPROVED'
      }
    }
  ],
  college: {
    name: 'Бишкекский финансово-экономический техникум им. А. Токтоналиева',
    parentOrganization: 'Научно-исследовательский университет Кыргызский экономический университет им. М. Рыскулбекова',
    website: 'https://bfet.kg',
    foundedYear: 1931,
    staffCount: '176+',
    studentCount: '2268+',
    address: 'Кыргызская Республика, г. Бишкек, пр. Чуй, 269',
    phones: ['(0312) 39 15 41', '(0312) 39 21 66'],
    email: 'vip.bfet@mail.ru',
    workingHours: 'Понедельник — Пятница 08:00 — 17:00, обед 12:00 — 13:00',
    mission: 'Обеспечение современного качественного образования, ориентированного на подготовку конкурентоспособных кадров нового поколения через сохранение традиций и внедрение инноваций.',
    specialties: [
      'Экономика и бухгалтерский учет',
      'Финансы: бюджет и бюджетный учет',
      'Финансы предприятий',
      'Банковское дело',
      'Страховое дело',
      'Налоги и налогообложение',
      'Менеджмент',
      'Маркетинг',
      'Операционная деятельность в логистике'
    ]
  },
  alumni: [],
  news: [
    {
      id: 'news-national-bank-museum',
      slug: 'national-bank-museum-visit',
      title: localized('Студенты БФЭТ посетили Музей Национального банка КР', 'БФЭТ студенттери КР Улуттук банкынын музейине барышты', 'BFET students visited the National Bank Museum'),
      body: localized('Студенты групп Б-1-23 и СД-1-23 в рамках дисциплины «Маркетинг» ознакомились с историей денежной системы и финансовых коммуникаций.'),
      authorName: 'БФЭТ',
      publishedAt: '2026-04-09T09:00:00.000Z',
      comments: []
    },
    {
      id: 'news-alumni-platform',
      slug: 'bfet-alumni-platform',
      title: localized('Ассоциация выпускников БФЭТ запускает цифровую базу', 'БФЭТ бутуруучулор ассоциациясы санарип базаны ишке киргизет', 'BFET Alumni Association launches a digital directory'),
      body: localized('Платформа объединяет выпускников БФЭТ, помогает развивать карьерные связи, менторство, мероприятия и поддержку студентов.'),
      authorName: 'Администрация ассоциации',
      publishedAt: '2026-04-29T09:00:00.000Z',
      comments: []
    }
  ],
  events: [
    {
      id: 'event-reunion',
      title: localized('Встреча выпускников БФЭТ 2026', 'БФЭТ бутуруучулор жолугушуусу 2026', 'BFET Alumni Reunion 2026'),
      description: localized('Тематическая встреча выпускников, студентов, преподавателей и партнеров техникума.'),
      startsAt: '2026-05-30T12:00:00.000Z',
      location: 'БФЭТ, г. Бишкек, пр. Чуй, 269',
      status: 'upcoming',
      registrations: []
    },
    {
      id: 'event-career',
      title: localized('Карьерная сессия для студентов БФЭТ', 'БФЭТ студенттери учун карьералык сессия', 'Career session for BFET students'),
      description: localized('Выпускники делятся опытом трудоустройства, практики и профессионального роста.'),
      startsAt: '2026-06-12T08:00:00.000Z',
      location: 'БФЭТ / онлайн',
      status: 'upcoming',
      registrations: []
    }
  ],
  campaigns: [
    {
      id: 'campaign-scholarships',
      title: localized('Поддержка талантливых студентов БФЭТ', 'БФЭТтин таланттуу студенттерин колдоо', 'Support for talented BFET students'),
      description: localized('Поддержка талантливых студентов, преподавателей, научных и образовательных проектов БФЭТ.'),
      goalAmount: 250000,
      raisedAmount: 145000,
      donations: [{ amount: 10000, donorName: 'Нурбек Осмонов', anonymous: false }],
      createdAt: '2026-04-10T09:00:00.000Z'
    },
    {
      id: 'campaign-equipment',
      title: localized('Материальная база БФЭТ', 'БФЭТ материалдык базасы', 'BFET facilities development'),
      description: localized('Помощь в развитии хорошо оснащенной материальной базы техникума.'),
      goalAmount: 400000,
      raisedAmount: 218000,
      donations: [],
      createdAt: '2026-04-12T09:00:00.000Z'
    }
  ],
  documents: [
    {
      id: 'doc-finance-2025',
      title: localized('Положение Ассоциации выпускников БФЭТ'),
      description: localized('Официальный раздел Ассоциации выпускников БФЭТ им. А. Токтоналиева.'),
      category: 'Документы ассоциации',
      fileUrl: 'https://bfet.kg/ass-vypusknikov/',
      fileType: 'PDF',
      publishedAt: '2026-01-15T09:00:00.000Z'
    },
    {
      id: 'doc-charter',
      title: localized('Анкета выпускника БФЭТ им. А. Токтоналиева'),
      description: localized('Анкета для пополнения базы данных выпускников БФЭТ.'),
      category: 'Анкеты',
      fileUrl: 'https://bfet.kg/ass-vypusknikov/',
      fileType: 'FORM',
      publishedAt: '2025-11-02T09:00:00.000Z'
    }
  ],
  companies: [
    {
      id: 'company-mbank',
      name: 'Mbank',
      logoUrl: '',
      description: 'Партнер БФЭТ, поддерживает подготовку студентов направления «Банковское дело».',
      website: 'https://mbank.kg',
      city: 'Бишкек',
      country: 'Кыргызстан',
      _count: { jobs: 1 }
    },
    {
      id: 'company-bpn',
      name: 'BPN',
      logoUrl: '',
      description: 'Общественное объединение предпринимателей, партнер БФЭТ по производственной практике студентов.',
      website: 'https://bfet.kg',
      city: 'Бишкек',
      country: 'Кыргызстан',
      _count: { jobs: 1 }
    }
  ],
  jobs: [
    {
      id: 'job-frontend-intern',
      authorId: 'dev-admin',
      companyId: 'company-mbank',
      title: 'Стажер в банковском отделе',
      description: 'Практика для студентов и выпускников БФЭТ по направлению «Банковское дело».',
      requirements: 'Базовые знания финансов, документооборот, ответственность',
      duties: 'Работа с клиентскими документами, помощь специалистам отдела, изучение банковских процессов',
      type: 'стажировка',
      format: 'гибрид',
      city: 'Бишкек',
      country: 'Кыргызстан',
      salary: 'по договоренности',
      deadline: '2026-06-01T18:00:00.000Z',
      contacts: 'vip.bfet@mail.ru',
      status: 'PUBLISHED',
      company: { id: 'company-mbank', name: 'Mbank' },
      applications: [],
      createdAt: '2026-04-17T09:00:00.000Z'
    },
    {
      id: 'job-finance-assistant',
      authorId: 'dev-admin',
      companyId: 'company-bpn',
      title: 'Практикант по финансам и учету',
      description: 'Практика для студентов БФЭТ по экономике, бухгалтерскому учету и финансам предприятий.',
      requirements: 'Excel, внимательность, базовая финансовая грамотность',
      duties: 'Подготовка отчетов, помощь аналитикам',
      type: 'практика',
      format: 'офис',
      city: 'Ош',
      country: 'Кыргызстан',
      salary: 'по договоренности',
      deadline: '2026-05-20T18:00:00.000Z',
      contacts: 'vip.bfet@mail.ru',
      status: 'PUBLISHED',
      company: { id: 'company-bpn', name: 'BPN' },
      applications: [],
      createdAt: '2026-04-16T09:00:00.000Z'
    }
  ],
  notifications: [
    {
      id: 'notification-welcome',
      userId: 'dev-admin',
      type: 'SYSTEM',
      title: 'Платформа запущена',
      message: 'Платформа Ассоциации выпускников БФЭТ готова для наполнения реальными данными.',
      read: false,
      createdAt: '2026-04-29T03:00:00.000Z'
    }
  ],
  mentorships: [],
  chatRooms: [
    { id: 'general', name: 'Общий чат', type: 'general', createdAt: '2026-04-29T03:00:00.000Z' },
    { id: 'jobs', name: 'Вакансии и стажировки', type: 'jobs', createdAt: '2026-04-29T03:00:00.000Z' },
    { id: 'mentorship', name: 'Менторство', type: 'mentorship', createdAt: '2026-04-29T03:00:00.000Z' }
  ],
  chatMessages: [],
  chatReports: [],
  directChats: [],
  directMessages: []
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.resolve(__dirname, '../data')
const dataFile = path.join(dataDir, 'mock-db.json')

const loadMockDb = () => {
  try {
    if (!fs.existsSync(dataFile)) return clone(defaultMockDb)
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'))
    return { ...clone(defaultMockDb), ...parsed }
  } catch (error) {
    console.warn('[mockData] Failed to read persisted mock DB, using defaults:', error.message)
    return clone(defaultMockDb)
  }
}

export const mockDb = loadMockDb()

export const saveMockDb = () => {
  fs.mkdirSync(dataDir, { recursive: true })
  fs.writeFileSync(dataFile, JSON.stringify(mockDb, null, 2), 'utf8')
}
