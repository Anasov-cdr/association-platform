# College Alumni Association Platform

Веб-платформа Ассоциации выпускников колледжа.

## 🛠️ Стек технологий

- **Frontend:** React 19 + Vite + Tailwind CSS + React Router + i18next + Zustand + Axios
- **Backend:** Node.js + Express + Prisma ORM + PostgreSQL + Socket.io
- **Auth:** JWT (Access + Refresh tokens) + bcrypt
- **Validation:** Zod (server-side)

## 📋 Предварительные требования

- Node.js 18+
- PostgreSQL 14+ (или Docker)
- npm или yarn

## 🚀 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка базы данных

#### Вариант A: Docker (рекомендуется)

```bash
docker-compose up -d
```

Это запустит PostgreSQL на порту 5432 и pgAdmin на порту 5050.

#### Вариант B: Локальная PostgreSQL

Создайте базу данных:

```sql
CREATE DATABASE alumni_db;
CREATE USER alumni_user WITH PASSWORD 'alumni_password';
ALTER ROLE alumni_user WITH SUPERUSER;
```

### 3. Миграции Prisma

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed  # (опционально, если есть seed файл)
```

### 4. Переменные окружения

Backend (apps/backend/.env):
```bash
cp .env.example .env
# Отредактируйте .env с вашими параметрами
```

Frontend (apps/frontend/.env):
```bash
VITE_API_BASE_URL=http://localhost:4000/api
```

### 5. Запуск в разработке

```bash
npm run dev
```

Это запустит:
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## 📚 Структура проекта

```
apps/
├── backend/
│   ├── src/
│   │   ├── middleware/      # Auth, Error handling
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── lib/             # Prisma client
│   │   └── server.js        # Express app
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/             # API client & hooks
    │   ├── pages/           # Page components
    │   ├── components/      # Reusable components
    │   ├── i18n/            # Translations (ru, ky, en)
    │   ├── store.js         # Zustand store
    │   └── App.jsx
    └── package.json
```

## 🔑 Тестовые аккаунты

После миграции можно использовать:

- **Admin:** admin@alumni.org / admin123
- **Moderator:** moderator@alumni.org / mod123
- **User:** user@alumni.org / alumni123

> ⚠️ Измените пароли в production!

## 📖 API Endpoints

### Аутентификация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `POST /api/auth/refresh` - Обновление токена

### Выпускники
- `GET /api/alumni` - Список выпускников (с фильтрами)
- `GET /api/alumni/:id` - Профиль выпускника
- `PUT /api/alumni/profile/me` - Обновить свой профиль
- `GET /api/alumni/admin/pending` - Ожидающие модерации (ADMIN)

### Новости
- `GET /api/news` - Все новости
- `GET /api/news/:id` - Одна новость
- `POST /api/news` - Создать (ADMIN)

### События
- `GET /api/events` - Все события
- `POST /api/events/:eventId/register` - Зарегистрироваться

### Вакансии
- `GET /api/jobs` - Вакансии
- `POST /api/jobs/:jobId/apply` - Подать заявку

### Пожертвования
- `GET /api/donations/campaigns` - Кампании
- `POST /api/donations/donate` - Пожертвовать

## 🔐 Аутентификация

Платформа использует JWT с двумя токенами:

```javascript
// Клиент отправляет
Authorization: Bearer {accessToken}

// После истечения accessToken, клиент отправляет
POST /api/auth/refresh
{ "refreshToken": "..." }
```

## 🌍 Мультиязычность

Поддерживаемые языки: Русский (ru), Кыргызский (ky), Английский (en)

Переключение через URL параметр: `/?lang=ky`

## 🐳 Docker

### Локальная разработка

```bash
docker-compose up
```

Это запустит:
- PostgreSQL
- pgAdmin (http://localhost:5050)

### Production

```bash
docker-compose -f docker-compose.prod.yml up
```

## 📦 Build

### Frontend
```bash
npm run build
```

### Backend
```bash
npm run build
```

## 🧪 Тестирование

```bash
npm run test        # Все тесты
npm run test:watch  # Watch режим
```

## 📋 Следующие этапы

- [ ] Загрузка файлов (S3/Supabase)
- [ ] Email уведомления
- [ ] Real-time чат (Socket.io)
- [ ] Полнотекстовый поиск
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## 📝 Лицензия

MIT

## 🤝 Contributing

1. Fork проект
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Контакты

Если у вас есть вопросы, свяжитесь с командой разработки.

