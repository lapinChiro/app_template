<template>
  <div class="database-test">
    <div class="container">
      <h1>Database Integration Test</h1>
      <p class="description">
        This page tests the full-stack integration: Vue Frontend → Hono Backend → PostgreSQL → Kysely.
      </p>

      <div class="test-controls">
        <button
          @click="runDatabaseTest"
          :disabled="loading"
          class="test-button"
          :class="{ loading }"
        >
          {{ loading ? 'Testing...' : 'Run Database Test' }}
        </button>

        <button
          @click="runHealthCheck"
          :disabled="loading"
          class="health-button"
        >
          Health Check
        </button>
      </div>

      <!-- Loading Spinner -->
      <div v-if="loading" class="loading-spinner">
        <div class="spinner"></div>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-section">
        <h3>❌ Error</h3>
        <p class="error-message">{{ error }}</p>
      </div>

      <!-- Health Check Result -->
      <div v-if="healthResult" class="health-section">
        <h3>💚 Health Check</h3>
        <pre class="result-json">{{ JSON.stringify(healthResult, null, 2) }}</pre>
      </div>

      <!-- Database Test Results -->
      <div v-if="testResult" class="results-section">
        <div class="result-header">
          <h3>{{ testResult.success ? '✅ Success' : '❌ Failed' }}</h3>
          <p class="result-message">{{ testResult.message }}</p>
        </div>

        <div v-if="testResult.success && testResult.data" class="data-section">
          <!-- Summary -->
          <div class="summary">
            <div class="summary-card">
              <h4>Total Users</h4>
              <div class="summary-number">{{ testResult.data.total_users }}</div>
            </div>
            <div class="summary-card">
              <h4>Existing Users</h4>
              <div class="summary-number">{{ testResult.data.existing_users.length }}</div>
            </div>
          </div>

          <!-- New User Created -->
          <div class="new-user">
            <h4>🆕 Newly Created User</h4>
            <div class="user-card">
              <div class="user-info">
                <span class="user-id">#{{ testResult.data.new_user.id }}</span>
                <span class="user-name">{{ testResult.data.new_user.name }}</span>
                <span class="user-email">{{ testResult.data.new_user.email }}</span>
              </div>
            </div>
          </div>

          <!-- Existing Users List -->
          <div class="existing-users">
            <h4>👥 Existing Users ({{ testResult.data.existing_users.length }})</h4>
            <div class="users-grid">
              <div
                v-for="user in testResult.data.existing_users"
                :key="user.id"
                class="user-card"
              >
                <div class="user-info">
                  <span class="user-id">#{{ user.id }}</span>
                  <span class="user-name">{{ user.name }}</span>
                  <span class="user-email">{{ user.email }}</span>
                  <span class="user-meta">
                    {{ user.active ? '✅ Active' : '❌ Inactive' }} |
                    {{ formatDate(user.created_at) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Raw JSON Data -->
          <details class="raw-data">
            <summary>🔍 View Raw Response</summary>
            <pre class="result-json">{{ JSON.stringify(testResult, null, 2) }}</pre>
          </details>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { apiClient } from '@/api'
import type { DatabaseTestResponse, HealthResponse, ApiError } from '@/api'

const loading = ref(false)
const error = ref<string | null>(null)
const testResult = ref<DatabaseTestResponse | null>(null)
const healthResult = ref<HealthResponse | null>(null)

const runDatabaseTest = async () => {
  loading.value = true
  error.value = null
  testResult.value = null
  healthResult.value = null

  try {
    const result = await apiClient.databaseTest()

    if ('success' in result) {
      if (result.success) {
        testResult.value = result as DatabaseTestResponse
      } else {
        const apiError = result as ApiError
        error.value = apiError.message + (apiError.error ? `: ${apiError.error}` : '')
      }
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Unknown error occurred'
  } finally {
    loading.value = false
  }
}

const runHealthCheck = async () => {
  loading.value = true
  error.value = null
  testResult.value = null
  healthResult.value = null

  try {
    healthResult.value = await apiClient.healthCheck()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Health check failed'
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString()
}
</script>

<style scoped>
.database-test {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 2rem;
}

h1 {
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.description {
  color: #7f8c8d;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.test-controls {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.test-button, .health-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.test-button {
  background: #3498db;
  color: white;
}

.test-button:hover:not(:disabled) {
  background: #2980b9;
}

.test-button:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.health-button {
  background: #27ae60;
  color: white;
}

.health-button:hover:not(:disabled) {
  background: #219a52;
}

.loading-spinner {
  text-align: center;
  margin: 2rem 0;
}

.spinner {
  display: inline-block;
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-radius: 50%;
  border-top: 4px solid #3498db;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-section {
  background: #fee;
  border: 1px solid #fcc;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
}

.error-section h3 {
  margin-top: 0;
  color: #e74c3c;
}

.error-message {
  color: #c0392b;
  font-family: monospace;
}

.health-section {
  background: #efe;
  border: 1px solid #cfc;
  padding: 1rem;
  border-radius: 6px;
  margin: 1rem 0;
}

.health-section h3 {
  margin-top: 0;
  color: #27ae60;
}

.results-section {
  margin-top: 2rem;
}

.result-header h3 {
  margin: 0 0 0.5rem 0;
  color: #2c3e50;
}

.result-message {
  color: #7f8c8d;
  margin: 0 0 1.5rem 0;
}

.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: #f8f9fa;
  padding: 1.5rem;
  border-radius: 8px;
  text-align: center;
  border: 1px solid #e9ecef;
}

.summary-card h4 {
  margin: 0 0 1rem 0;
  color: #495057;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-number {
  font-size: 2.5rem;
  font-weight: bold;
  color: #3498db;
}

.new-user, .existing-users {
  margin: 2rem 0;
}

.new-user h4, .existing-users h4 {
  margin-bottom: 1rem;
  color: #2c3e50;
}

.users-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.user-card {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-id {
  font-size: 12px;
  color: #6c757d;
  font-weight: bold;
}

.user-name {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.user-email {
  font-size: 14px;
  color: #7f8c8d;
}

.user-meta {
  font-size: 12px;
  color: #6c757d;
  margin-top: 0.5rem;
}

.raw-data {
  margin-top: 2rem;
  border: 1px solid #dee2e6;
  border-radius: 8px;
}

.raw-data summary {
  padding: 1rem;
  background: #f8f9fa;
  cursor: pointer;
  font-weight: 600;
  color: #495057;
}

.raw-data summary:hover {
  background: #e9ecef;
}

.result-json {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 1rem;
  margin: 1rem 0;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.5;
  color: #495057;
}
</style>