export interface User {
  id: string
  name: string
  email: string
  role: "user" | "admin"
}

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null

  const userData = localStorage.getItem("fmp-user")
  if (!userData) return null

  try {
    return JSON.parse(userData)
  } catch {
    return null
  }
}

export const setCurrentUser = (user: User): void => {
  localStorage.setItem("fmp-user", JSON.stringify(user))
}

export const clearCurrentUser = (): void => {
  localStorage.removeItem("fmp-user")
}

export const isAuthenticated = (): boolean => {
  return getCurrentUser() !== null
}

export const isAdmin = (): boolean => {
  const user = getCurrentUser()
  return user?.role === "admin"
}

// Mock authentication function
export const authenticateUser = async (email: string, password: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  if (!email || !password) {
    throw new Error("Email y contraseña son requeridos")
  }

  // Mock user data based on email
  const userData: User = {
    email,
    name: email.includes("admin") ? "Administrador FMP" : "Usuario FMP",
    role: email.includes("admin") ? "admin" : "user",
    id: Math.random().toString(36).substr(2, 9),
  }

  return userData
}
