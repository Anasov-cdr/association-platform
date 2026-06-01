import { Navigate, Route, Routes, useParams } from 'react-router-dom'
import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Layout } from './components/Layout'
import { AdminPage } from './pages/AdminPage'
import { AlumniDirectoryPage } from './pages/AlumniDirectoryPage'
import { ChatPage } from './pages/ChatPage'
import { DocumentsPage } from './pages/DocumentsPage'
import { DonationsPage } from './pages/DonationsPage'
import { EventsPage } from './pages/EventsPage'
import { HomePage } from './pages/HomePage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { MentorshipPage } from './pages/MentorshipPage'
import { NewsPage } from './pages/NewsPage'
import { NewsDetailPage } from './pages/NewsDetailPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { CompaniesPage } from './pages/CompaniesPage'
import { CabinetPage } from './pages/CabinetPage'
import { EventDetailPage } from './pages/EventDetailPage'
import { DonationCampaignPage } from './pages/DonationCampaignPage'
import { AlumniProfilePage } from './pages/AlumniProfilePage'
import { AboutPage } from './pages/AboutPage'

function LanguageBoundary() {
  const { lang = 'ru' } = useParams()
  const { i18n } = useTranslation()
  useEffect(() => { i18n.changeLanguage(lang) }, [lang, i18n])
  return <Layout />
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/ru" replace />} />
      <Route path=":lang" element={<LanguageBoundary />}>
        <Route index element={<HomePage />} />
        <Route path="alumni" element={<AlumniDirectoryPage />} />
        <Route path="alumni/:id" element={<AlumniProfilePage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        <Route path="mentorship" element={<MentorshipPage />} />
        <Route path="donations" element={<DonationsPage />} />
        <Route path="donations/:id" element={<DonationCampaignPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="companies" element={<CompaniesPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="cabinet" element={<CabinetPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/ru" replace />} />
    </Routes>
  )
}
