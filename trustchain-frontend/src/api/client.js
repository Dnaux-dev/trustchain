import axios from 'axios'

// ── Axios instance ────────────────────────────────────────────────
const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
})

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tc_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally — dispatch a custom event so React Router
// handles the redirect without hard page reloads
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const is401 = err.response?.status === 401
    const isLoginRoute = window.location.pathname === '/login'
    const isAuthEndpoint = err.config?.url?.includes('/auth/')

    if (is401 && !isLoginRoute && !isAuthEndpoint) {
      localStorage.removeItem('tc_token')
      localStorage.removeItem('tc_user')
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
}

// ── Payments ──────────────────────────────────────────────────────
export const paymentsAPI = {
  verifySession:   (data) => api.post('/payments/verify-session', data),
  submitChallenge: (data) => api.post('/payments/challenge', data),
}

// ── Users ─────────────────────────────────────────────────────────
export const usersAPI = {
  getMe:        ()             => api.get('/users/me'),
  getProfile:   ()             => api.get('/users/me/profile'),
  getSessions:  (limit = 20)  => api.get(`/users/me/sessions?limit=${limit}`),
  addHelper:    (data)        => api.post('/users/me/helpers', data),
  getHelpers:   ()             => api.get('/users/me/helpers'),
  removeHelper: (id)          => api.delete(`/users/me/helpers/${id}`),
}

// ── Dashboard ─────────────────────────────────────────────────────
export const dashboardAPI = {
  getStats:    () => api.get('/dashboard/stats'),
  getRiskFeed: () => api.get('/dashboard/risk-feed'),
}

export default api
