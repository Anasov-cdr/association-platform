const STAFF_ROLES = new Set(['ADMIN', 'MODERATOR'])
const SERVICE_ADMIN_EMAILS = new Set(['admin@bfetassociation.kg'])

export const isPublicAlumniProfile = (profile) => {
  const role = profile?.user?.role || profile?.role || 'ALUMNI'
  const email = (profile?.user?.email || profile?.email || '').trim().toLowerCase()
  const fullName = (profile?.fullName || '').toLowerCase()
  const specialty = (profile?.specialty || '').toLowerCase()

  return !(
    STAFF_ROLES.has(role) ||
    SERVICE_ADMIN_EMAILS.has(email) ||
    (fullName.includes('администратор') && specialty.includes('администр'))
  )
}

export const filterPublicAlumniProfiles = (profiles) =>
  Array.isArray(profiles) ? profiles.filter(isPublicAlumniProfile) : []
