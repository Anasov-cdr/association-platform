import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppStore = create(
  persist(
    (set) => ({
      // Auth
      user: null,
      accessToken: null,
      refreshToken: null,
      role: 'GUEST',
      email: null,

      // Setters
      setAuth: ({ user, accessToken, refreshToken }) => {
        set({
          user,
          accessToken,
          refreshToken,
          role: user?.role || 'GUEST',
          email: user?.email
        })
        if (accessToken) localStorage.setItem('accessToken', accessToken)
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken)
      },

      logout: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          role: 'GUEST',
          email: null
        })
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
      },

      setUser: (user) => set({ user }),

      // Notification state
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, { id: Date.now(), ...notification }]
        })),
      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id)
        }))
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        role: state.role,
        email: state.email
      })
    }
  )
)
