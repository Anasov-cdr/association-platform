export const getLocalized = (value, lang = 'ru') => {
  if (!value || typeof value === 'string') return value || ''
  return value[lang] || value.ru || value.en || Object.values(value)[0] || ''
}
