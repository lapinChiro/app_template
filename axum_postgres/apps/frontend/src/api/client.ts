import type { 
  DatabaseTestResponse, 
  HealthResponse, 
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ErrorResponse 
} from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

class ApiClient {
  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  async healthCheck(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health')
  }

  async databaseTest(): Promise<DatabaseTestResponse | ErrorResponse> {
    try {
      return await this.request<DatabaseTestResponse>('/api/db-test')
    } catch (error) {
      return {
        success: false,
        message: 'Failed to connect to backend API',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // New User management API methods using generated types
  async getUsers(): Promise<UserResponse[]> {
    return this.request<UserResponse[]>('/api/users')
  }

  async getUserById(id: string): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${id}`)
  }

  async createUser(userData: CreateUserRequest): Promise<UserResponse> {
    return this.request<UserResponse>('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<UserResponse> {
    return this.request<UserResponse>(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  }

  async deleteUser(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient