import { create } from 'zustand'
const useAuthStore = create(set => ({
  token: localStorage.getItem('tc_token') || null,
  user: JSON.parse(localStorage.getItem('tc_user') || 'null'),
  setAuth: (token, user) => {
    localStorage.setItem('tc_token', token)
    localStorage.setItem('tc_user', JSON.stringify(user))
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('tc_token')
    localStorage.removeItem('tc_user')
    set({ token: null, user: null })
  },
  updateUser: updates => set(s => {
    const u = { ...s.user, ...updates }
    localStorage.setItem('tc_user', JSON.stringify(u))
    return { user: u }
  }),
}))
export default useAuthStore
