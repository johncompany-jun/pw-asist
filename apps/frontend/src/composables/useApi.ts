import { useAuth } from '../store/auth'

export const API = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useApi() {
  const { state } = useAuth()

  function authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${state.token}` }
  }

  return { authHeaders }
}
