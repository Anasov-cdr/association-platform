import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

export const languages = ['ru', 'ky', 'en']

const resources = {
  ru: {
    translation: {
      brand: 'Бишкекский финансово-экономический техникум Alumni',
      nav: {
        home: 'Главная', alumni: 'Выпускники', jobs: 'Вакансии', companies: 'Компании',
        mentorship: 'Менторство', donations: 'Пожертвования', events: 'Мероприятия',
        news: 'Новости', docs: 'Документы', chat: 'Чат', notifications: 'Уведомления',
        cabinet: 'Кабинет', admin: 'Админ'
      },
      heroTitle: 'Ассоциация выпускников Бишкекского финансово-экономического техникума им. А. Токтоналиева',
      heroText: 'Цифровое пространство выпускников Бишкекского финансово-экономического техникума: база выпускников, менторство, карьера, мероприятия, поддержка студентов и связь с техникумом.',
      join: 'Стать участником',
      donate: 'Сделать пожертвование',
      find: 'Найти выпускника',
      stats: { alumni: 'Студентов БФЭТ', donations: 'Собрано', jobs: 'Вакансий', mentors: 'Сотрудников БФЭТ' },
      sections: {
        latestNews: 'Последние новости', events: 'Ближайшие мероприятия',
        campaigns: 'Кампании сбора', directory: 'Каталог выпускников',
        register: 'Регистрация выпускника', documents: 'Отчеты и документы',
        admin: 'Админ-панель', donations: 'Пожертвования', jobs: 'Вакансии',
        mentorship: 'Менторство', chat: 'Чат', notifications: 'Уведомления'
      },
      common: {
        loading: 'Загрузка...', error: 'Ошибка', save: 'Сохранить', cancel: 'Отмена',
        back: 'Назад', edit: 'Редактировать', delete: 'Удалить', view: 'Просмотр',
        create: 'Создать', noData: 'Данные не найдены', all: 'Все', yes: 'Да', no: 'Нет',
        learnMore: 'Подробнее', apply: 'Откликнуться', send: 'Отправить', close: 'Закрыть',
        reset: 'Сбросить', search: 'Поиск', filter: 'Фильтр', submit: 'Отправить'
      },
      statuses: {
        DRAFT: 'Черновик', PENDING: 'На проверке', APPROVED: 'Подтвержден',
        REJECTED: 'Отклонен', BLOCKED: 'Заблокирован', PUBLISHED: 'Опубликовано',
        ARCHIVED: 'В архиве', CLOSED: 'Закрыто',
        SENT: 'Отправлен', VIEWED: 'Просмотрен', INVITED: 'Приглашен', ACCEPTED: 'Принят',
        upcoming: 'Предстоящее', completed: 'Завершено', cancelled: 'Отменено'
      },
      profile: {
        about: 'О выпускнике',
        bio: 'Биография',
        achievements: 'Достижения',
        skills: 'Навыки',
        career: 'Карьера',
        position: 'Должность',
        noPosition: 'Должность не указана',
        company: 'Компания',
        noCompany: 'Компания не указана',
        contacts: 'Контакты',
        phone: 'Телефон',
        email: 'Электронная почта',
        socialLinks: 'Социальные сети',
        graduationYear: 'год выпуска',
        specialty: 'Специальность',
        group: 'Группа',
        location: 'Местоположение',
        mentor: 'Ментор',
        helpStudents: 'Помощь студентам',
        sponsor: 'Спонсор',
        employer: 'Работодатель',
        active: 'Активный выпускник',
        graduate: 'Выпускник',
        noInfo: 'Информация будет добавлена выпускником или администратором.',
        noSkills: 'Навыки не указаны.',
        status: 'Статус профиля'
      },
      directory: {
        title: 'Каталог выпускников',
        search: 'Поиск по ФИО, специальности, городу...',
        filterYear: 'Год выпуска',
        filterSpecialty: 'Специальность',
        filterCity: 'Город',
        filterMentor: 'Готов быть ментором',
        filterEmployer: 'Работодатель',
        empty: 'Выпускники не найдены',
        profile: 'Профиль',
        results: 'Найдено',
        resetFilters: 'Сбросить фильтры'
      },
      cabinet: {
        title: 'Личный кабинет',
        loginTitle: 'Вход выпускника',
        loginDesc: 'Войдите, чтобы управлять профилем, вакансиями, менторством и уведомлениями.',
        logout: 'Выйти',
        profileTitle: 'Мой профиль',
        profileSaved: 'Профиль сохранен и отправлен на проверку модератору',
        security: 'Безопасность',
        securityDesc: 'Смените пароль, если доступ был выдан администратором.',
        currentPassword: 'Текущий пароль',
        newPassword: 'Новый пароль (минимум 8 символов)',
        updatePassword: 'Обновить пароль',
        passwordUpdated: 'Пароль обновлен',
        myJobs: 'Мои вакансии',
        jobCreated: 'Вакансия создана. После проверки появится публично.',
        myApplications: 'Мои отклики',
        noApplications: 'Вы ещё не откликались на вакансии.',
        myMentorships: 'Менторство',
        noMentorships: 'Активных запросов менторства нет.',
        notifications: 'Уведомления',
        unread: 'Непрочитанных',
        markAllRead: 'Прочитать все',
        noNotifications: 'Уведомлений нет.',
        fields: {
          fullName: 'Полное имя', graduationYear: 'Год выпуска', specialty: 'Специальность',
          groupName: 'Группа', city: 'Город', country: 'Страна', company: 'Место работы',
          position: 'Должность', phone: 'Телефон', bio: 'Биография',
          achievements: 'Достижения', skills: 'Навыки (через запятую)',
          linkedin: 'LinkedIn URL', github: 'GitHub URL', telegram: 'Telegram URL',
          website: 'Личный сайт URL', showEmail: 'Показывать электронную почту', showPhone: 'Показывать телефон',
          isMentor: 'Готов быть ментором', canHelpStudents: 'Готов помогать студентам',
          mentorArea: 'Область помощи (для менторов)', mentorFormat: 'Формат менторства',
          mentorAvailability: 'Доступность (часы, дни)'
        }
      },
      jobs: {
        title: 'Вакансии и стажировки',
        myJobs: 'Мои вакансии',
        allJobs: 'Все вакансии',
        createJob: 'Добавить вакансию',
        noJobs: 'Вакансий пока нет.',
        apply: 'Откликнуться',
        applyTitle: 'Отклик на вакансию',
        cvUrl: 'Ссылка на резюме (Google Docs, HH, LinkedIn)',
        coverLetter: 'Сопроводительное письмо',
        sendApplication: 'Отправить отклик',
        applicationSent: 'Отклик отправлен!',
        applications: 'Откликов',
        deadline: 'Дедлайн',
        salary: 'Зарплата',
        requirements: 'Требования',
        duties: 'Обязанности',
        contacts: 'Контакты',
        private: 'Частное лицо',
        types: { работа: 'Работа', стажировка: 'Стажировка', практика: 'Практика', волонтер: 'Волонтёрство' },
        formats: { офис: 'Офис', удаленно: 'Удалённо', гибрид: 'Гибрид' }
      },
      mentorship: {
        title: 'Менторство',
        subtitle: 'Найдите выпускника, готового помочь студентам и молодым специалистам.',
        info: 'Информация о менторстве',
        area: 'Область помощи',
        format: 'Формат',
        availability: 'Доступность',
        online: 'Онлайн',
        offline: 'Офлайн',
        both: 'Онлайн и офлайн',
        sendRequest: 'Отправить запрос',
        requestSent: 'Запрос на менторство отправлен!',
        requestTitle: 'Запрос ментору',
        goalsLabel: 'Опишите цели и вопросы для ментора',
        goalsPlaceholder: 'Например: хочу узнать о карьере в IT, нужна помощь с трудоустройством...',
        noMentors: 'Активных менторов пока нет.',
        loginRequired: 'Войдите в систему, чтобы отправить запрос ментору.',
        statuses: { active: 'Активно', pending: 'Ожидание', completed: 'Завершено', rejected: 'Отклонено' }
      },
      donations: {
        title: 'Пожертвования и спонсорство',
        goal: 'Цель',
        raised: 'Собрано',
        percent: 'собрано',
        donate: 'Сделать пожертвование',
        donateCta: 'Пожертвовать',
        anonymous: 'Анонимно',
        donorName: 'Имя донора',
        amount: 'Сумма (KGS)',
        send: 'Отправить',
        sent: 'Пожертвование отправлено на подтверждение.',
        donorsList: 'Список доноров',
        noDonors: 'Пожертвований пока нет.',
        anonymousDonor: 'Анонимный донор',
        bankDetails: 'Реквизиты для перевода',
        bankName: 'Банк',
        accountNumber: 'Номер счёта',
        orQr: 'или отсканируйте QR-код',
        manualConfirm: 'После перевода свяжитесь с администратором для подтверждения.',
        backToCampaigns: 'Все кампании'
      },
      companies: {
        title: 'Компании-партнеры',
        subtitle: 'Компании, в которых работают наши выпускники или которые предлагают стажировки.',
        website: 'Сайт компании',
        jobs: 'Вакансий',
        alumni: 'Выпускников в компании',
        noAlumni: 'Зарегистрированных выпускников нет.'
      },
      notifications: {
        title: 'Уведомления',
        center: 'Центр уведомлений',
        unread: 'Непрочитанных',
        markRead: 'Прочитано',
        markAllRead: 'Прочитать все',
        empty: 'Уведомлений нет.',
        new: 'Новое',
        delete: 'Удалить',
        types: {
          ALUMNI_PENDING: 'Анкета выпускника', PROFILE_UPDATED: 'Профиль обновлён',
          PROFILE_APPROVED: 'Профиль одобрен', PROFILE_REJECTED: 'Профиль отклонён',
          JOB_PENDING: 'Вакансия на проверке', DONATION_PENDING: 'Пожертвование ожидает',
          DONATION_STATUS: 'Статус пожертвования', NEW_MESSAGE: 'Новое сообщение',
          MENTORSHIP_REQUEST: 'Запрос менторства', PROFILE_STATUS: 'Статус профиля'
        }
      },
      events: {
        title: 'Мероприятия', register: 'Зарегистрироваться', registered: 'Зарегистрирован',
        location: 'Место проведения', starts: 'Начало', loginRequired: 'Войдите, чтобы зарегистрироваться.'
      }
    }
  },
  ky: {
    translation: {
      brand: 'БФЭТ Alumni',
      nav: {
        home: 'Башкы', alumni: 'Бутуруучулор', jobs: 'Вакансиялар', companies: 'Компаниялар',
        mentorship: 'Менторлук', donations: 'Кайрымдуулук', events: 'Иш-чаралар',
        news: 'Жанылыктар', docs: 'Документтер', chat: 'Чат', notifications: 'Билдирүүлөр',
        cabinet: 'Кабинет', admin: 'Админ'
      },
      heroTitle: 'А. Токтоналиев атындагы БФЭТ бутуруучулор ассоциациясы',
      heroText: 'Бишкек финансы-экономикалык техникумунун бутуруучулору үчүн санариптик платформа: база, менторлук, карьера, иш-чаралар жана студенттерди колдоо.',
      join: 'Катышуучу болуу', donate: 'Кайрымдуулук кылуу', find: 'Бутуруучуну табуу',
      stats: { alumni: 'БФЭТ студенти', donations: 'Чогулду', jobs: 'Вакансия', mentors: 'БФЭТ кызматкери' },
      sections: {
        latestNews: 'Акыркы жанылыктар', events: 'Жакынкы иш-чаралар',
        campaigns: 'Кайрымдуулук кампаниялары', directory: 'Бутуруучулар каталогу',
        register: 'Бутуруучуну каттоо', documents: 'Отчеттор жана документтер',
        admin: 'Админ-панель', donations: 'Кайрымдуулук', jobs: 'Вакансиялар',
        mentorship: 'Менторлук', chat: 'Чат', notifications: 'Билдирүүлөр'
      },
      common: {
        loading: 'Жүктөлүүдө...', error: 'Ката', save: 'Сактоо', cancel: 'Жокко чыгаруу',
        back: 'Артка', edit: 'Түзөтүү', delete: 'Жок кылуу', view: 'Көрүү',
        create: 'Түзүү', noData: 'Маалымат жок', all: 'Баары', yes: 'Ооба', no: 'Жок',
        learnMore: 'Толугураак', apply: 'Арыз берүү', send: 'Жөнөтүү', close: 'Жабуу',
        reset: 'Баштапкы', search: 'Издөө', filter: 'Фильтр', submit: 'Жөнөтүү'
      },
      statuses: {
        DRAFT: 'Долбоор', PENDING: 'Текшерүүдө', APPROVED: 'Ырасталган',
        REJECTED: 'Четке кагылган', BLOCKED: 'Бөгөлгөн', PUBLISHED: 'Жарыяланган',
        ARCHIVED: 'Архивде', CLOSED: 'Жабылган',
        SENT: 'Жөнөтүлдү', VIEWED: 'Каралды', INVITED: 'Чакырылды', ACCEPTED: 'Кабыл алынды',
        upcoming: 'Алдыда', completed: 'Аяктады', cancelled: 'Жокко чыгарылды'
      },
      profile: {
        about: 'Бутуруучу жөнүндө', bio: 'Өмүр баяны', achievements: 'Жетишкендиктер',
        skills: 'Көндүмдөр', career: 'Карьера', position: 'Кызмат', noPosition: 'Кызматы белгисиз',
        company: 'Компания', noCompany: 'Компания белгисиз', contacts: 'Байланыш',
        phone: 'Телефон', email: 'Электрондук почта', socialLinks: 'Социалдык тармактар',
        graduationYear: 'бүтүрүү жылы', specialty: 'Адистик', group: 'Топ',
        location: 'Жайгашкан жер', mentor: 'Ментор', helpStudents: 'Студенттерге жардам',
        sponsor: 'Демөөрчү', employer: 'Иш берүүчү', active: 'Активдүү бүтүрүүчү',
        graduate: 'Бүтүрүүчү', noInfo: 'Маалымат кошулбаган.', noSkills: 'Көндүмдөр белгисиз.',
        status: 'Профиль статусу'
      },
      directory: {
        title: 'Бутуруучулар каталогу', search: 'ФИО, адистик, шаар боюнча издөө...',
        filterYear: 'Бүтүрүү жылы', filterSpecialty: 'Адистик', filterCity: 'Шаар',
        filterMentor: 'Ментор болууга даяр', filterEmployer: 'Иш берүүчү',
        empty: 'Бутуруучулар табылган жок', profile: 'Профиль',
        results: 'Табылды', resetFilters: 'Фильтрди тазалоо'
      },
      cabinet: {
        title: 'Жеке кабинет', loginTitle: 'Кирүү', logout: 'Чыгуу',
        profileTitle: 'Менин профилим', security: 'Коопсуздук',
        myJobs: 'Менин вакансияларым', myApplications: 'Менин арыздарым',
        myMentorships: 'Менторлук', notifications: 'Билдирүүлөр',
        unread: 'Окулбаган', markAllRead: 'Баарын окулган деп белгилөө',
        noNotifications: 'Билдирүү жок.',
        fields: {
          fullName: 'Толук аты', graduationYear: 'Бүтүрүү жылы', specialty: 'Адистик',
          groupName: 'Топ', city: 'Шаар', country: 'Өлкө', company: 'Жумушчу орун',
          position: 'Кызмат', phone: 'Телефон', bio: 'Өмүр баяны',
          achievements: 'Жетишкендиктер', skills: 'Көндүмдөр (үтүр менен)',
          linkedin: 'LinkedIn', github: 'GitHub', telegram: 'Telegram',
          showEmail: 'Электрондук почтаны көрсөтүү', showPhone: 'Телефонду көрсөтүү',
          isMentor: 'Ментор болууга даяр', canHelpStudents: 'Студенттерге жардам берүүгө даяр',
          mentorArea: 'Жардам берүү чөйрөсү', mentorFormat: 'Формат', mentorAvailability: 'Убакыты'
        }
      },
      jobs: {
        title: 'Вакансиялар жана стажировкалар', myJobs: 'Менин вакансияларым',
        allJobs: 'Бардык вакансиялар', noJobs: 'Вакансия жок.',
        apply: 'Арыз берүү', deadline: 'Мөөнөт', salary: 'Айлык', contacts: 'Байланыш',
        types: { работа: 'Жумуш', стажировка: 'Стажировка', практика: 'Практика', волонтер: 'Волонтёрство' },
        formats: { офис: 'Офис', удаленно: 'Алыстан', гибрид: 'Гибрид' }
      },
      mentorship: {
        title: 'Менторлук', subtitle: 'Студенттерге жардам берүүгө даяр бутуруучуну табыңыз.',
        info: 'Менторлук жөнүндө', area: 'Жардам берүү чөйрөсү', format: 'Формат',
        availability: 'Убакыты', online: 'Онлайн', offline: 'Офлайн', both: 'Онлайн жана офлайн',
        sendRequest: 'Суроо жөнөтүү', requestSent: 'Менторлук суроосу жөнөтүлдү!',
        requestTitle: 'Ментор суроосу', goalsLabel: 'Максаттарыңызды жана суроолоруңузду жазыңыз',
        noMentors: 'Активдүү менторлор жок.', loginRequired: 'Суроо жөнөтүү үчүн кириңиз.'
      },
      donations: {
        title: 'Кайрымдуулук', goal: 'Максат', raised: 'Чогулду', percent: 'чогулду',
        donate: 'Кайрымдуулук кылуу', donateCta: 'Кайрымдуулук',
        anonymous: 'Анонимдүү', donorName: 'Донордун аты', amount: 'Сумма (KGS)',
        send: 'Жөнөтүү', sent: 'Кайрымдуулук ырастоого жөнөтүлдү.',
        donorsList: 'Донорлордун тизмеси', noDonors: 'Кайрымдуулук жок.',
        anonymousDonor: 'Анонимдүү донор', bankDetails: 'Банк реквизиттери',
        manualConfirm: 'Которуудан кийин администраторго кайрылыңыз.', backToCampaigns: 'Бардык кампаниялар'
      },
      companies: {
        title: 'Өнөктөш компаниялар', subtitle: 'Бутуруучулар иштеген компаниялар.',
        website: 'Компания сайты', jobs: 'Вакансия', alumni: 'Компаниядагы бутуруучулар',
        noAlumni: 'Катталган бутуруучу жок.'
      },
      notifications: {
        title: 'Билдирүүлөр', center: 'Билдирүүлөр борбору', unread: 'Окулбаган',
        markRead: 'Окулду', markAllRead: 'Баарын окулган деп белгилөө',
        empty: 'Билдирүү жок.', new: 'Жаңы', delete: 'Жок кылуу',
        types: {
          ALUMNI_PENDING: 'Бутуруучу анкетасы', PROFILE_APPROVED: 'Профиль ырасталды',
          PROFILE_REJECTED: 'Профиль четке кагылды', JOB_PENDING: 'Вакансия текшерүүдө',
          DONATION_PENDING: 'Кайрымдуулук күтүүдө', NEW_MESSAGE: 'Жаңы билдирүү',
          MENTORSHIP_REQUEST: 'Менторлук суроосу'
        }
      },
      events: {
        title: 'Иш-чаралар', register: 'Катталуу', registered: 'Катталган',
        location: 'Өткөрүлүүчү жер', starts: 'Башталуу', loginRequired: 'Катталуу үчүн кириңиз.'
      }
    }
  },
  en: {
    translation: {
      brand: 'BFET Alumni',
      nav: {
        home: 'Home', alumni: 'Alumni', jobs: 'Jobs', companies: 'Companies',
        mentorship: 'Mentorship', donations: 'Donations', events: 'Events',
        news: 'News', docs: 'Documents', chat: 'Chat', notifications: 'Notifications',
        cabinet: 'Cabinet', admin: 'Admin'
      },
      heroTitle: 'Alumni Association of A. Toktonaliev BFET',
      heroText: 'A digital space for graduates of Bishkek Financial and Economic Technical College: alumni directory, mentoring, careers, events, student support and connection with the college.',
      join: 'Become a member', donate: 'Donate', find: 'Find alumni',
      stats: { alumni: 'BFET students', donations: 'Raised', jobs: 'Jobs', mentors: 'BFET staff' },
      sections: {
        latestNews: 'Latest news', events: 'Upcoming events', campaigns: 'Donation campaigns',
        directory: 'Alumni directory', register: 'Alumni registration',
        documents: 'Reports and documents', admin: 'Admin panel', donations: 'Donations',
        jobs: 'Jobs', mentorship: 'Mentorship', chat: 'Chat', notifications: 'Notifications'
      },
      common: {
        loading: 'Loading...', error: 'Error', save: 'Save', cancel: 'Cancel',
        back: 'Back', edit: 'Edit', delete: 'Delete', view: 'View',
        create: 'Create', noData: 'No data found', all: 'All', yes: 'Yes', no: 'No',
        learnMore: 'Learn more', apply: 'Apply', send: 'Send', close: 'Close',
        reset: 'Reset', search: 'Search', filter: 'Filter', submit: 'Submit'
      },
      statuses: {
        DRAFT: 'Draft', PENDING: 'Under review', APPROVED: 'Approved',
        REJECTED: 'Rejected', BLOCKED: 'Blocked', PUBLISHED: 'Published',
        ARCHIVED: 'Archived', CLOSED: 'Closed',
        SENT: 'Sent', VIEWED: 'Viewed', INVITED: 'Invited', ACCEPTED: 'Accepted',
        upcoming: 'Upcoming', completed: 'Completed', cancelled: 'Cancelled'
      },
      profile: {
        about: 'About', bio: 'Biography', achievements: 'Achievements',
        skills: 'Skills', career: 'Career', position: 'Position', noPosition: 'No position',
        company: 'Company', noCompany: 'No company', contacts: 'Contacts',
        phone: 'Phone', email: 'Email', socialLinks: 'Social links',
        graduationYear: 'graduation year', specialty: 'Specialty', group: 'Group',
        location: 'Location', mentor: 'Mentor', helpStudents: 'Student support',
        sponsor: 'Sponsor', employer: 'Employer', active: 'Active alumni',
        graduate: 'Graduate', noInfo: 'Information not provided yet.', noSkills: 'No skills listed.',
        status: 'Profile status'
      },
      directory: {
        title: 'Alumni Directory', search: 'Search by name, specialty, city...',
        filterYear: 'Graduation year', filterSpecialty: 'Specialty', filterCity: 'City',
        filterMentor: 'Ready to mentor', filterEmployer: 'Employer',
        empty: 'No alumni found', profile: 'Profile',
        results: 'Found', resetFilters: 'Reset filters'
      },
      cabinet: {
        title: 'Personal Cabinet', loginTitle: 'Sign In', logout: 'Sign Out',
        profileTitle: 'My Profile', security: 'Security',
        myJobs: 'My Jobs', myApplications: 'My Applications',
        myMentorships: 'Mentorship', notifications: 'Notifications',
        unread: 'Unread', markAllRead: 'Mark all as read', noNotifications: 'No notifications.',
        fields: {
          fullName: 'Full Name', graduationYear: 'Graduation Year', specialty: 'Specialty',
          groupName: 'Group', city: 'City', country: 'Country', company: 'Employer',
          position: 'Position', phone: 'Phone', bio: 'Biography',
          achievements: 'Achievements', skills: 'Skills (comma separated)',
          linkedin: 'LinkedIn URL', github: 'GitHub URL', telegram: 'Telegram URL',
          website: 'Personal website URL', showEmail: 'Show email', showPhone: 'Show phone',
          isMentor: 'Ready to be a mentor', canHelpStudents: 'Ready to help students',
          mentorArea: 'Area of expertise (for mentors)', mentorFormat: 'Mentorship format',
          mentorAvailability: 'Availability (hours, days)'
        }
      },
      jobs: {
        title: 'Jobs & Internships', myJobs: 'My Jobs', allJobs: 'All Jobs', noJobs: 'No jobs yet.',
        apply: 'Apply', deadline: 'Deadline', salary: 'Salary', contacts: 'Contacts',
        types: { работа: 'Job', стажировка: 'Internship', практика: 'Practice', волонтер: 'Volunteer' },
        formats: { офис: 'Office', удаленно: 'Remote', гибрид: 'Hybrid' }
      },
      mentorship: {
        title: 'Mentorship', subtitle: 'Find an alumni ready to help students and young professionals.',
        info: 'Mentorship Info', area: 'Area of expertise', format: 'Format',
        availability: 'Availability', online: 'Online', offline: 'Offline', both: 'Online & Offline',
        sendRequest: 'Send Request', requestSent: 'Mentorship request sent!',
        requestTitle: 'Mentor Request', goalsLabel: 'Describe your goals and questions',
        goalsPlaceholder: 'E.g.: want advice on IT career, need help with job search...',
        noMentors: 'No active mentors yet.', loginRequired: 'Sign in to send a request.'
      },
      donations: {
        title: 'Donations & Sponsorship', goal: 'Goal', raised: 'Raised', percent: 'raised',
        donate: 'Make a Donation', donateCta: 'Donate',
        anonymous: 'Anonymous', donorName: 'Donor name', amount: 'Amount (KGS)',
        send: 'Send', sent: 'Donation submitted for confirmation.',
        donorsList: 'Donors list', noDonors: 'No donations yet.',
        anonymousDonor: 'Anonymous donor', bankDetails: 'Bank details',
        manualConfirm: 'After transfer, contact the administrator for confirmation.', backToCampaigns: 'All campaigns'
      },
      companies: {
        title: 'Partner Companies', subtitle: 'Companies where our alumni work or offer internships.',
        website: 'Company website', jobs: 'Jobs', alumni: 'Alumni at company', noAlumni: 'No registered alumni.'
      },
      notifications: {
        title: 'Notifications', center: 'Notification Center', unread: 'Unread',
        markRead: 'Mark read', markAllRead: 'Mark all as read',
        empty: 'No notifications.', new: 'New', delete: 'Delete',
        types: {
          ALUMNI_PENDING: 'Alumni application', PROFILE_APPROVED: 'Profile approved',
          PROFILE_REJECTED: 'Profile rejected', JOB_PENDING: 'Job under review',
          DONATION_PENDING: 'Donation pending', NEW_MESSAGE: 'New message',
          MENTORSHIP_REQUEST: 'Mentorship request'
        }
      },
      events: {
        title: 'Events', register: 'Register', registered: 'Registered',
        location: 'Venue', starts: 'Starts', loginRequired: 'Sign in to register.'
      }
    }
  }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false }
})

export default i18n
