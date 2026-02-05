export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted'
export type Theme = 'light' | 'dark' | 'system'
export type TokenType = 'email_verification' | 'password_reset' | 'email_change'

export interface User {
  id: string
  username?: string
  email: string
  status: UserStatus
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface UserProfile {
  user_id: string
  display_name?: string
  first_name?: string
  last_name?: string
  bio?: string
  avatar_url?: string
  cover_url?: string
  location?: string
  website?: string
  birth_date?: string
  gender?: string
  pronouns?: string
}

export interface UserPreferences {
  user_id: string
  language: string
  timezone: string
  theme: Theme
  notification_settings: Record<string, unknown>
  privacy_settings: Record<string, unknown>
  marketing_opt_in: boolean
}

export interface UserVerification {
  user_id: string
  email_verified_at?: string
  phone_number?: string
  phone_verified_at?: string
}

export interface Role {
  id: string
  name: string
  description?: string
  created_at: string
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  expires_at: string
}

export interface AuthResponse {
  tokens: TokenPair
  user: User
}

export interface TwoFactorResponse {
  requires_2fa: true
  user_id: string
}

export interface Enable2FAResponse {
  secret: string
  backup_codes: string[]
}

export interface RegisterRequest {
  email: string
  password: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface Login2FARequest {
  user_id: string
  code: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface Confirm2FARequest {
  secret: string
  code: string
  backup_codes: string[]
}

export interface UpdateUsernameRequest {
  username: string
}

export interface GouserfyConfig {
  baseURL: string
  onTokenRefresh?: (tokens: TokenPair) => void
  onAuthError?: () => void
  storage?: TokenStorage
}

export interface TokenStorage {
  get(): TokenPair | null
  set(tokens: TokenPair): void
  clear(): void
}

export interface ApiError {
  error: string
  status: number
}
