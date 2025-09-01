import type { DatabaseTestResponse, HealthResponse, ApiError } from './types'

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

  async databaseTest(): Promise<DatabaseTestResponse | ApiError> {
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
}

export const apiClient = new ApiClient()
export default apiClient