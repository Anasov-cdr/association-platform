import nodemailer from 'nodemailer'

const SMTP_CONFIGURED = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD)

let _transporter = null

const getTransporter = () => {
  if (_transporter) return _transporter

  if (!SMTP_CONFIGURED) return null

  _transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    tls: { rejectUnauthorized: false }
  })

  return _transporter
}

const FROM = process.env.SMTP_FROM || 'Ассоциация выпускников БФЭТ <noreply@bfetassociation.kg>'

const baseHtml = (content) => `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ассоциация выпускников БФЭТ</title>
</head>
<body style="margin:0;padding:0;background:#f0f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a2e35;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9fb;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0879a8,#3bc4c7);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
              <p style="margin:0;font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.65);">Ассоциация выпускников</p>
              <h1 style="margin:8px 0 0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.2;">БФЭТ им. А. Токтоналиева</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px 32px;border:2px solid #8edfe7;border-top:none;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f5fdff;border:2px solid #8edfe7;border-top:none;border-radius:0 0 16px 16px;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#6b8fa0;">
                Бишкекский финансово-экономический техникум им. А. Токтоналиева<br/>
                г. Бишкек, пр. Чуй, 269 · <a href="https://bfet.kg" style="color:#1d9fbd;text-decoration:none;">bfet.kg</a>
              </p>
              <p style="margin:8px 0 0;font-size:11px;color:#9ab0bc;">
                Это автоматическое письмо. Пожалуйста, не отвечайте на него.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

const btn = (href, text) =>
  `<a href="${href}" style="display:inline-block;margin-top:24px;background:#1d9fbd;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 28px;border-radius:50px;">${text}</a>`

const h2 = (text) =>
  `<h2 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#0c2a35;">${text}</h2>`

const p = (text) =>
  `<p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#2d4a57;">${text}</p>`

const highlight = (text) =>
  `<div style="background:#f0f9fb;border-left:4px solid #1d9fbd;border-radius:8px;padding:14px 18px;margin:16px 0;font-size:14px;color:#1a3a4a;">${text}</div>`

export const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter()

  if (!transporter) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('✉️  EMAIL (SMTP не настроен — вывод в консоль)')
    console.log(`Кому:  ${to}`)
    console.log(`Тема:  ${subject}`)
    console.log(`Текст: ${text}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
    return { simulated: true }
  }

  try {
    const info = await transporter.sendMail({ from: FROM, to, subject, text, html })
    console.log(`[Email] Отправлено: ${info.messageId} → ${to}`)
    return info
  } catch (err) {
    console.error(`[Email] Ошибка отправки → ${to}:`, err.message)
    return null
  }
}

// ── Шаблоны ────────────────────────────────────────────────────────────────

export const sendRegistrationApprovedEmail = async (email, fullName) => {
  const platformUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  return sendEmail({
    to: email,
    subject: '✅ Ваш профиль одобрен — Ассоциация выпускников БФЭТ',
    text: `Здравствуйте, ${fullName}!\n\nВаш профиль успешно проверен и опубликован в каталоге выпускников БФЭТ. Добро пожаловать!\n\nВойти в кабинет: ${platformUrl}/ru/cabinet`,
    html: baseHtml(`
      ${h2('Ваш профиль одобрен!')}
      ${p(`Здравствуйте, <strong>${fullName}</strong>!`)}
      ${p('Ваша анкета прошла проверку модератором и теперь опубликована в каталоге выпускников БФЭТ.')}
      ${highlight('Теперь вы можете войти в личный кабинет, дополнить профиль, откликаться на вакансии и общаться с другими выпускниками.')}
      ${btn(`${platformUrl}/ru/cabinet`, 'Войти в кабинет')}
    `)
  })
}

export const sendRegistrationRejectedEmail = async (email, fullName, reason = '') => {
  const platformUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  return sendEmail({
    to: email,
    subject: 'Анкета не прошла проверку — Ассоциация выпускников БФЭТ',
    text: `Здравствуйте, ${fullName}!\n\nК сожалению, ваша анкета не прошла проверку.${reason ? `\n\nПричина: ${reason}` : ''}\n\nВы можете отправить анкету повторно: ${platformUrl}/ru/register`,
    html: baseHtml(`
      ${h2('Анкета не прошла проверку')}
      ${p(`Здравствуйте, <strong>${fullName}</strong>!`)}
      ${p('К сожалению, ваша анкета не была одобрена модератором.')}
      ${reason ? highlight(`<strong>Причина:</strong> ${reason}`) : ''}
      ${p('Вы можете исправить данные и отправить анкету повторно.')}
      ${btn(`${platformUrl}/ru/register`, 'Отправить повторно')}
    `)
  })
}

export const sendNewApplicationEmail = async (employerEmail, jobTitle, applicantName) => {
  const platformUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  return sendEmail({
    to: employerEmail,
    subject: `📬 Новый отклик на вакансию «${jobTitle}»`,
    text: `Здравствуйте!\n\nНа вашу вакансию «${jobTitle}» откликнулся: ${applicantName}.\n\nПросмотреть отклики: ${platformUrl}/ru/admin`,
    html: baseHtml(`
      ${h2('Новый отклик на вакансию')}
      ${p('Здравствуйте!')}
      ${highlight(`На вашу вакансию <strong>«${jobTitle}»</strong> откликнулся кандидат: <strong>${applicantName}</strong>`)}
      ${p('Войдите в административную панель, чтобы просмотреть резюме и принять решение.')}
      ${btn(`${platformUrl}/ru/admin`, 'Открыть отклики')}
    `)
  })
}

export const sendMentorshipRequestEmail = async (mentorEmail, mentorName, studentName, goals) => {
  const platformUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  return sendEmail({
    to: mentorEmail,
    subject: `🤝 Запрос на менторство от ${studentName}`,
    text: `Здравствуйте, ${mentorName}!\n\n${studentName} отправил запрос на менторство.\n\nЦели: ${goals}\n\nПлатформа: ${platformUrl}/ru/cabinet`,
    html: baseHtml(`
      ${h2('Запрос на менторство')}
      ${p(`Здравствуйте, <strong>${mentorName}</strong>!`)}
      ${p(`<strong>${studentName}</strong> хотел бы получить вашу помощь как ментора.`)}
      ${highlight(`<strong>Цели:</strong> ${goals}`)}
      ${p('Войдите в личный кабинет, чтобы ответить на запрос.')}
      ${btn(`${platformUrl}/ru/cabinet`, 'Открыть кабинет')}
    `)
  })
}

export const sendDonationConfirmEmail = async (donorEmail, donorName, campaignTitle, amount) => {
  return sendEmail({
    to: donorEmail,
    subject: `💚 Спасибо за вашу поддержку — ${campaignTitle}`,
    text: `Здравствуйте, ${donorName}!\n\nСпасибо за ваш вклад в кампанию «${campaignTitle}» на сумму ${Number(amount).toLocaleString()} KGS. Ваша поддержка очень важна!`,
    html: baseHtml(`
      ${h2('Спасибо за вашу поддержку!')}
      ${p(`Здравствуйте, <strong>${donorName || 'дорогой участник'}</strong>!`)}
      ${highlight(`Кампания: <strong>${campaignTitle}</strong><br/>Сумма: <strong>${Number(amount).toLocaleString()} KGS</strong>`)}
      ${p('Ваша поддержка помогает развивать образование и сообщество выпускников БФЭТ. Большое спасибо!')}
    `)
  })
}

export const sendPasswordResetEmail = async (email, resetUrl) => {
  return sendEmail({
    to: email,
    subject: '🔑 Сброс пароля — Ассоциация выпускников БФЭТ',
    text: `Вы запросили сброс пароля.\n\nПерейдите по ссылке для установки нового пароля (действует 1 час):\n${resetUrl}\n\nЕсли вы не запрашивали сброс — просто проигнорируйте это письмо.`,
    html: baseHtml(`
      ${h2('Сброс пароля')}
      ${p('Вы (или кто-то другой) запросили сброс пароля для вашей учётной записи.')}
      ${highlight('Ссылка действительна <strong>1 час</strong>. Если вы не запрашивали сброс — просто проигнорируйте это письмо.')}
      ${btn(resetUrl, 'Установить новый пароль')}
      ${p('<small style="color:#6b8fa0;">Если кнопка не работает, скопируйте ссылку в браузер:<br/>' + resetUrl + '</small>')}
    `)
  })
}

export const sendEventRegistrationEmail = async (userEmail, userName, eventTitle, startsAt) => {
  const platformUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const date = startsAt ? new Date(startsAt).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' }) : ''
  return sendEmail({
    to: userEmail,
    subject: `📅 Регистрация на мероприятие: ${eventTitle}`,
    text: `Здравствуйте, ${userName}!\n\nВы зарегистрировались на мероприятие «${eventTitle}»${date ? `. Начало: ${date}` : ''}.\n\nПлатформа: ${platformUrl}/ru/events`,
    html: baseHtml(`
      ${h2('Вы зарегистрированы!')}
      ${p(`Здравствуйте, <strong>${userName}</strong>!`)}
      ${highlight(`<strong>${eventTitle}</strong>${date ? `<br/>📅 Начало: ${date}` : ''}`)}
      ${p('Ждём вас! Следите за обновлениями в разделе мероприятий.')}
      ${btn(`${platformUrl}/ru/events`, 'Смотреть мероприятия')}
    `)
  })
}
