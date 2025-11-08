export interface User {
  id: string
  email: string
  name: string
  createdAt: number
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

const USERS_STORAGE_KEY = "wellness-users"
const CURRENT_USER_KEY = "wellness-current-user"

// Initialize storage with demo user
export const initializeAuth = () => {
  if (typeof window === "undefined") return

  const existing = localStorage.getItem(USERS_STORAGE_KEY)
  if (!existing) {
    const demoUser: User = {
      id: "demo-" + Date.now(),
      email: "demo@wellness.com",
      name: "Demo User",
      createdAt: Date.now(),
    }
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([demoUser]))
  }
}

export const login = (email: string, password: string): User | null => {
  if (typeof window === "undefined") return null

  const users = JSON.parse(localStorage.getItem(USERS_STORAGE_KEY) || "[]")
  const user = users.find((u: any) => u.email === email && atob(u.passwordHash) === password)

  if (user) {
    const { passwordHash, ...safeUser } = user
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser))
    return safeUser
  }

  return null
}

export const logout = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(CURRENT_USER_KEY)
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const user = localStorage.getItem(CURRENT_USER_KEY)
  return user ? JSON.parse(user) : null
}

export const isUserAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false
  return !!localStorage.getItem(CURRENT_USER_KEY)
}
