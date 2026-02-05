import type {
  GouserfyConfig,
  TokenPair,
  TokenStorage,
  User,
  UserProfile,
  UserPreferences,
  Role,
  AuthResponse,
  TwoFactorResponse,
  Enable2FAResponse,
  RegisterRequest,
  LoginRequest,
  Login2FARequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  Confirm2FARequest,
  UpdateUsernameRequest,
  ApiError,
} from './types'
import { LocalStorage } from './storage'

export class GouserfyError extends Error {
  status: number
  
  constructor(message: string, status: number) {
    super(message)
    this.name = 'GouserfyError'
    this.status = status
  }
}

export class Gouserfy {
  private baseURL: string
  private storage: TokenStorage
  private onTokenRefresh?: (tokens: TokenPair) => void
  private onAuthError?: () => void
  private refreshPromise: Promise<TokenPair> | null = null

  auth: AuthAPI
  users: UsersAPI

  constructor(config: GouserfyConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '')
    this.storage = config.storage ?? new LocalStorage()
    this.onTokenRefresh = config.onTokenRefresh
    this.onAuthError = config.onAuthError

    this.auth = new AuthAPI(this)
    this.users = new UsersAPI(this)
  }

  getTokens(): TokenPair | null {
    return this.storage.get()
  }

  setTokens(tokens: TokenPair): void {
    this.storage.set(tokens)
    this.onTokenRefresh?.(tokens)
  }

  clearTokens(): void {
    this.storage.clear()
  }

  isAuthenticated(): boolean {
    const tokens = this.getTokens()
    if (!tokens) return false
    return new Date(tokens.expires_at) > new Date()
  }

  async request<T>(
    method: string,
    path: string,
    body?: unknown,
    authenticated = false,
    retry = true
  ): Promise<T> {
    const url = `${this.baseURL}/api/v1${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (authenticated) {
      const tokens = this.getTokens()
      if (!tokens) {
        throw new GouserfyError('Not authenticated', 401)
      }

      if (new Date(tokens.expires_at) <= new Date() && retry) {
        await this.refreshTokens()
        return this.request<T>(method, path, body, authenticated, false)
      }

      headers['Authorization'] = `Bearer ${tokens.access_token}`
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      if (response.status === 401 && authenticated && retry) {
        try {
          await this.refreshTokens()
          return this.request<T>(method, path, body, authenticated, false)
        } catch {
          this.clearTokens()
          this.onAuthError?.()
          throw new GouserfyError('Session expired', 401)
        }
      }

      const error: ApiError = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new GouserfyError(error.error, response.status)
    }

    if (response.status === 204) {
      return {} as T
    }

    return response.json()
  }

  private async refreshTokens(): Promise<TokenPair> {
    if (this.refreshPromise) {
      return this.refreshPromise
    }

    this.refreshPromise = (async () => {
      const tokens = this.getTokens()
      if (!tokens) {
        throw new GouserfyError('No refresh token', 401)
      }

      const response = await fetch(`${this.baseURL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: tokens.refresh_token }),
      })

      if (!response.ok) {
        this.clearTokens()
        throw new GouserfyError('Token refresh failed', 401)
      }

      const newTokens: TokenPair = await response.json()
      this.setTokens(newTokens)
      return newTokens
    })()

    try {
      return await this.refreshPromise
    } finally {
      this.refreshPromise = null
    }
  }
}

class AuthAPI {
  constructor(private client: Gouserfy) {}

  async register(data: RegisterRequest): Promise<{ user: User; verification_token: string }> {
    return this.client.request('POST', '/auth/register', data)
  }

  async login(data: LoginRequest): Promise<AuthResponse | TwoFactorResponse> {
    const response = await this.client.request<AuthResponse | TwoFactorResponse>('POST', '/auth/login', data)
    if ('tokens' in response) {
      this.client.setTokens(response.tokens)
    }
    return response
  }

  async login2FA(data: Login2FARequest): Promise<AuthResponse> {
    const response = await this.client.request<AuthResponse>('POST', '/auth/login/2fa', data)
    this.client.setTokens(response.tokens)
    return response
  }

  async logout(): Promise<void> {
    const tokens = this.client.getTokens()
    if (tokens) {
      await this.client.request('POST', '/auth/logout', { refresh_token: tokens.refresh_token }).catch(() => {})
    }
    this.client.clearTokens()
  }

  async logoutAll(): Promise<void> {
    await this.client.request('POST', '/auth/logout/all', {}, true)
    this.client.clearTokens()
  }

  async verifyEmail(token: string): Promise<void> {
    await this.client.request('POST', '/auth/verify-email', { token })
  }

  async forgotPassword(email: string): Promise<{ reset_token?: string }> {
    return this.client.request('POST', '/auth/forgot-password', { email })
  }

  async resetPassword(data: ResetPasswordRequest): Promise<void> {
    await this.client.request('POST', '/auth/reset-password', data)
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await this.client.request('POST', '/auth/change-password', data, true)
  }

  async enable2FA(): Promise<Enable2FAResponse> {
    return this.client.request('POST', '/auth/2fa/enable', {}, true)
  }

  async confirm2FA(data: Confirm2FARequest): Promise<void> {
    await this.client.request('POST', '/auth/2fa/confirm', data, true)
  }

  async disable2FA(code: string): Promise<void> {
    await this.client.request('POST', '/auth/2fa/disable', { code }, true)
  }
}

class UsersAPI {
  constructor(private client: Gouserfy) {}

  async me(): Promise<User> {
    return this.client.request('GET', '/users/me', undefined, true)
  }

  async getById(id: string): Promise<User> {
    return this.client.request('GET', `/users/${id}`, undefined, true)
  }

  async delete(): Promise<void> {
    await this.client.request('DELETE', '/users/me', undefined, true)
    this.client.clearTokens()
  }

  async getProfile(): Promise<UserProfile> {
    return this.client.request('GET', '/users/me/profile', undefined, true)
  }

  async updateProfile(profile: Partial<UserProfile>): Promise<void> {
    await this.client.request('PUT', '/users/me/profile', profile, true)
  }

  async getPreferences(): Promise<UserPreferences> {
    return this.client.request('GET', '/users/me/preferences', undefined, true)
  }

  async updatePreferences(prefs: Partial<UserPreferences>): Promise<void> {
    await this.client.request('PUT', '/users/me/preferences', prefs, true)
  }

  async getRoles(): Promise<Role[]> {
    return this.client.request('GET', '/users/me/roles', undefined, true)
  }

  async updateUsername(username: string): Promise<void> {
    await this.client.request<void>('PUT', '/users/me/username', { username } as UpdateUsernameRequest, true)
  }
}
