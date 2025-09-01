import { describe, it, expect } from 'vitest'
import { app } from '../../src/app.js'

describe('Basic API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const res = await app.request('/health')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toEqual({ status: 'ok' })
    })
    
    it('should have correct content type', async () => {
      const res = await app.request('/health')
      expect(res.headers.get('content-type')).toContain('application/json')
    })
  })

  describe('GET /api/hello', () => {
    it('should return hello message', async () => {
      const res = await app.request('/api/hello')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data).toEqual({ message: 'Hello from API' })
    })
  })

  describe('GET /doc', () => {
    it('should return OpenAPI specification', async () => {
      const res = await app.request('/doc')
      expect(res.status).toBe(200)
      
      const data = await res.json()
      expect(data.openapi).toBe('3.0.0')
      expect(data.info.title).toBe('Project Manager API')
    })
  })
})