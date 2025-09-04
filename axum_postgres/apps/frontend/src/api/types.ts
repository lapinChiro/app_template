// API Types - Auto-generated from Rust backend
// Import generated types from the type sync system  
import type { components } from '../../../../packages/openapi-spec/generated/types'

// Export convenient type aliases for the frontend
export type UserResponse = components['schemas']['UserResponse']
export type CreateUserRequest = components['schemas']['CreateUserRequest']
export type UpdateUserRequest = components['schemas']['UpdateUserRequest']
export type ErrorResponse = components['schemas']['ErrorResponse']

// Legacy types for compatibility (to be migrated)
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

// Use generated ErrorResponse instead of local ApiError
export type ApiError = ErrorResponse