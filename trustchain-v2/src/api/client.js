import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('tc_token')
  if (t) cfg.headers.Authorization = `Bearer ${t}`
  return cfg
})
api.interceptors.response.use(r => r, err => {
  if (err.response?.status === 401) {
    localStorage.removeItem('tc_token')
    localStorage.removeItem('tc_user')
    window.dispatchEvent(new Event('auth:logout'))
  }
  return Promise.reject(err)
})

export const authAPI = {
  register: d => api.post('/auth/register', d),
  login: d => api.post('/auth/login', d),
}
export const paymentsAPI = {
  verifySession: d => api.post('/payments/verify-session', d),
  submitChallenge: d => api.post('/payments/challenge', d),
}
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  getProfile: () => api.get('/users/me/profile'),
  getSessions: (l=20) => api.get(`/users/me/sessions?limit=${l}`),
  addHelper: d => api.post('/users/me/helpers', d),
  getHelpers: () => api.get('/users/me/helpers'),
  removeHelper: id => api.delete(`/users/me/helpers/${id}`),
}
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getRiskFeed: () => api.get('/dashboard/risk-feed'),
}
export const intelligenceAPI = {
  getWarRoom: () => api.get('/intelligence/war-room'),
  getDrift: () => api.get('/intelligence/drift'),
  getAlerts: () => api.get('/intelligence/alerts'),
  resolveAlert: id => api.post(`/intelligence/alerts/${id}/resolve`),
  getCreditScore: () => api.get('/intelligence/credit-score'),
  refreshProfile: () => api.post('/intelligence/refresh-profile'),
}
export const banksAPI = {
  getLinkedBanks: () => api.get('/linked-banks'),
  linkBank: d => api.post('/linked-banks', d),
  unlinkBank: id => api.delete(`/linked-banks/${id}`),
  setPrimary: id => api.post(`/linked-banks/${id}/primary`),
}

export default api
