export const sendEmail = async ({ to, subject, text, html }) => {
  // В реальном проекте здесь будет интеграция с Nodemailer, SendGrid или Resend
  console.log('\n=======================================')
  console.log(`✉️ ИМИТАЦИЯ ОТПРАВКИ EMAIL`)
  console.log(`Кому: ${to}`)
  console.log(`Тема: ${subject}`)
  console.log(`Текст: ${text}`)
  console.log('=======================================\n')

  return true
}

export const sendRegistrationApprovedEmail = async (email, fullName) => {
  return sendEmail({
    to: email,
    subject: 'Ваш профиль в Ассоциации Выпускников одобрен!',
    text: `Здравствуйте, ${fullName}!\nВаш профиль был успешно проверен модератором и теперь опубликован в каталоге выпускников. Добро пожаловать!`
  })
}

export const sendNewApplicationEmail = async (employerEmail, jobTitle, applicantName) => {
  return sendEmail({
    to: employerEmail,
    subject: `Новый отклик на вакансию "${jobTitle}"`,
    text: `Здравствуйте!\nНа вашу вакансию "${jobTitle}" откликнулся кандидат: ${applicantName}. Зайдите в раздел "Мои вакансии", чтобы просмотреть резюме.`
  })
}
