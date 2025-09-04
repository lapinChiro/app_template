<template>
  <div class="users-view">
    <h1>User Management</h1>
    
    <!-- Create User Form -->
    <div class="create-user-section">
      <h2>Create New User</h2>
      <form @submit.prevent="handleCreateUser" class="user-form">
        <div class="form-group">
          <label for="name">Name:</label>
          <input 
            id="name"
            v-model="newUser.name" 
            type="text" 
            required 
            placeholder="Enter user name"
          />
        </div>
        
        <div class="form-group">
          <label for="email">Email:</label>
          <input 
            id="email"
            v-model="newUser.email" 
            type="email" 
            required 
            placeholder="Enter user email"
          />
        </div>
        
        <button type="submit" :disabled="isCreating" class="btn-primary">
          {{ isCreating ? 'Creating...' : 'Create User' }}
        </button>
      </form>
    </div>

    <!-- Users List -->
    <div class="users-list-section">
      <div class="section-header">
        <h2>Users List</h2>
        <button @click="loadUsers" :disabled="isLoading" class="btn-secondary">
          {{ isLoading ? 'Refreshing...' : 'Refresh' }}
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="loading">
        Loading users...
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error">
        <p>{{ error }}</p>
        <button @click="loadUsers" class="btn-secondary">Retry</button>
      </div>

      <!-- Users Table -->
      <div v-else-if="users.length > 0" class="users-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.id }}</td>
              <td>
                <span v-if="!user.editing">{{ user.name }}</span>
                <input v-else v-model="user.editData!.name" type="text" />
              </td>
              <td>
                <span v-if="!user.editing">{{ user.email }}</span>
                <input v-else v-model="user.editData!.email" type="email" />
              </td>
              <td>
                <span v-if="!user.editing">{{ user.active ? 'Active' : 'Inactive' }}</span>
                <select v-else v-model="user.editData!.active">
                  <option :value="true">Active</option>
                  <option :value="false">Inactive</option>
                </select>
              </td>
              <td>{{ formatDate(user.created_at) }}</td>
              <td class="actions">
                <div v-if="!user.editing">
                  <button @click="startEdit(user)" class="btn-small">Edit</button>
                  <button @click="handleDeleteUser(user.id)" class="btn-danger">Delete</button>
                </div>
                <div v-else>
                  <button @click="handleSaveUser(user)" :disabled="isUpdating" class="btn-small">
                    {{ isUpdating ? 'Saving...' : 'Save' }}
                  </button>
                  <button @click="cancelEdit(user)" class="btn-small">Cancel</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <p>No users found. Create the first user above!</p>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" class="message" :class="messageType">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { apiClient } from '@/api'
import type { UserResponse, CreateUserRequest, UpdateUserRequest } from '@/api/types'

// Reactive state
const users = ref<(UserResponse & { editing?: boolean; editData?: UpdateUserRequest })[]>([])
const newUser = ref<CreateUserRequest>({ name: '', email: '' })
const isLoading = ref(false)
const isCreating = ref(false)
const isUpdating = ref(false)
const error = ref<string | null>(null)
const message = ref<string | null>(null)
const messageType = ref<'success' | 'error'>('success')

// Load users from API
const loadUsers = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    const usersData = await apiClient.getUsers()
    users.value = usersData.map(user => ({ ...user, editing: false }))
    showMessage('Users loaded successfully', 'success')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load users'
    showMessage('Failed to load users', 'error')
  } finally {
    isLoading.value = false
  }
}

// Create new user
const handleCreateUser = async () => {
  if (!newUser.value.name.trim() || !newUser.value.email.trim()) {
    showMessage('Please fill in all fields', 'error')
    return
  }

  isCreating.value = true
  
  try {
    await apiClient.createUser(newUser.value)
    newUser.value = { name: '', email: '' }
    await loadUsers() // Refresh the list
    showMessage('User created successfully', 'success')
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Failed to create user', 'error')
  } finally {
    isCreating.value = false
  }
}

// Start editing user
const startEdit = (user: UserResponse & { editing?: boolean; editData?: UpdateUserRequest }) => {
  user.editing = true
  user.editData = {
    name: user.name,
    email: user.email,
    active: user.active
  }
}

// Cancel editing
const cancelEdit = (user: UserResponse & { editing?: boolean; editData?: UpdateUserRequest }) => {
  user.editing = false
  user.editData = undefined
}

// Save user changes
const handleSaveUser = async (user: UserResponse & { editing?: boolean; editData?: UpdateUserRequest }) => {
  if (!user.editData) return

  isUpdating.value = true
  
  try {
    await apiClient.updateUser(user.id, user.editData)
    await loadUsers() // Refresh the list
    showMessage('User updated successfully', 'success')
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Failed to update user', 'error')
  } finally {
    isUpdating.value = false
  }
}

// Delete user
const handleDeleteUser = async (id: string) => {
  if (!confirm('Are you sure you want to delete this user?')) {
    return
  }

  try {
    await apiClient.deleteUser(id)
    await loadUsers() // Refresh the list
    showMessage('User deleted successfully', 'success')
  } catch (err) {
    showMessage(err instanceof Error ? err.message : 'Failed to delete user', 'error')
  }
}

// Show message with auto-clear
const showMessage = (msg: string, type: 'success' | 'error') => {
  message.value = msg
  messageType.value = type
  setTimeout(() => {
    message.value = null
  }, 5000)
}

// Format date for display
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString()
}

// Load users on component mount
onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.create-user-section, .users-list-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #f9f9f9;
}

.user-form {
  display: flex;
  gap: 15px;
  align-items: end;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input {
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  min-width: 200px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.users-table table {
  width: 100%;
  border-collapse: collapse;
}

.users-table th,
.users-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.users-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-primary, .btn-secondary, .btn-small, .btn-danger {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.btn-small {
  background-color: #28a745;
  color: white;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-small:hover:not(:disabled) {
  background-color: #1e7e34;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
  padding: 4px 8px;
  font-size: 12px;
}

.btn-danger:hover:not(:disabled) {
  background-color: #c82333;
}

.btn-primary:disabled, .btn-secondary:disabled, .btn-small:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  text-align: center;
  padding: 20px;
  color: #dc3545;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.message {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 20px;
  border-radius: 4px;
  color: white;
  z-index: 1000;
}

.message.success {
  background-color: #28a745;
}

.message.error {
  background-color: #dc3545;
}

input[type="text"], input[type="email"], select {
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 14px;
  min-width: 150px;
}
</style>