// Backend API Response Types

export interface TestUser {
  id: number
  name: string
  email: string
  active: boolean
  created_at: string
}

export interface DatabaseTestResponse {
  success: boolean
  message: string
  data: {
    existing_users: TestUser[]
    new_user: {
      id: number
      name: string
      email: string
    }
    total_users: number
  }
}

export interface HealthResponse {
  status: string
}

export interface ApiError {
  success: false
  message: string
  error: string
}