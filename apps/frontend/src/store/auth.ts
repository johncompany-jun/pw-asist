import { reactive, readonly } from 'vue'

interface User {
  id: number
  email: string
  name: string
  isAdmin: boolean
}

interface AuthState {
  user: User | null
  token: string | null
}

const state = reactive<AuthState>({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
})

export function useAuth() {
  const login = (user: User, token: string) => {
    state.user = user
    state.token = token
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
  }

  const logout = () => {
    state.user = null
    state.token = null
    localStorage.removeItem('user')
    localStorage.removeItem('token')
  }

  const isAuthenticated = () => !!state.token

  return {
    state: readonly(state),
    login,
    logout,
    isAuthenticated,
  }
}
