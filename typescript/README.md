# Gouserfy TypeScript SDK

TypeScript SDK for Gouserfy authentication API.

## Installation

```bash
npm install gouserfy-sdk
# or
yarn add gouserfy-sdk
# or
pnpm add gouserfy-sdk
```

## Quick Start

```typescript
import { GouserfyClient } from 'gouserfy-sdk';

const client = new GouserfyClient({
  baseURL: 'http://localhost:8080',
});

// Register
const user = await client.register({
  email: 'user@example.com',
  password: 'securePassword123',
});

// Login
const authResponse = await client.login({
  email: 'user@example.com',
  password: 'securePassword123',
});

// Get current user
const me = await client.me();
```

## Configuration

```typescript
import { GouserfyClient, MemoryStorage } from 'gouserfy-sdk';

const client = new GouserfyClient({
  baseURL: 'http://localhost:8080',
  storage: new MemoryStorage(), // Use memory storage instead of localStorage
  onAuthStateChange: (user) => {
    console.log('Auth state changed:', user);
  },
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `baseURL` | `string` | - | API base URL (required) |
| `storage` | `TokenStorage` | `LocalStorage` | Token storage implementation |
| `onAuthStateChange` | `(user: User \| null) => void` | - | Callback for auth state changes |

## API Reference

### Authentication

#### `register(data: RegisterRequest): Promise<User>`

Register a new user.

```typescript
const user = await client.register({
  email: 'user@example.com',
  password: 'securePassword123',
});
```

#### `login(data: LoginRequest): Promise<AuthResponse>`

Login with email and password.

```typescript
const response = await client.login({
  email: 'user@example.com',
  password: 'securePassword123',
});
// response.user, response.access_token, response.refresh_token
```

#### `logout(): Promise<void>`

Logout and clear tokens.

```typescript
await client.logout();
```

#### `me(): Promise<User>`

Get current authenticated user.

```typescript
const user = await client.me();
```

#### `refreshToken(): Promise<AuthResponse>`

Refresh the access token.

```typescript
const response = await client.refreshToken();
```

### User Management

#### `getUser(id: string): Promise<User>`

Get user by ID.

```typescript
const user = await client.getUser('user-uuid');
```

#### `updateUser(id: string, data: UpdateUserRequest): Promise<User>`

Update user.

```typescript
const user = await client.updateUser('user-uuid', {
  email: 'new@example.com',
});
```

#### `deleteUser(id: string): Promise<void>`

Delete user.

```typescript
await client.deleteUser('user-uuid');
```

### Password

#### `changePassword(data: ChangePasswordRequest): Promise<void>`

Change password.

```typescript
await client.changePassword({
  current_password: 'oldPassword',
  new_password: 'newSecurePassword123',
});
```

#### `requestPasswordReset(email: string): Promise<void>`

Request password reset email.

```typescript
await client.requestPasswordReset('user@example.com');
```

#### `resetPassword(data: ResetPasswordRequest): Promise<void>`

Reset password with token.

```typescript
await client.resetPassword({
  token: 'reset-token',
  new_password: 'newSecurePassword123',
});
```

### Two-Factor Authentication (2FA)

#### `setup2FA(): Promise<TwoFactorSetupResponse>`

Setup 2FA and get QR code.

```typescript
const setup = await client.setup2FA();
// setup.secret, setup.qr_code (base64)
```

#### `enable2FA(code: string): Promise<{ backup_codes: string[] }>`

Enable 2FA with TOTP code.

```typescript
const result = await client.enable2FA('123456');
// result.backup_codes - save these!
```

#### `disable2FA(code: string): Promise<void>`

Disable 2FA.

```typescript
await client.disable2FA('123456');
```

#### `verify2FA(code: string): Promise<AuthResponse>`

Verify 2FA during login.

```typescript
const response = await client.verify2FA('123456');
```

### Email Verification

#### `requestEmailVerification(): Promise<void>`

Request verification email.

```typescript
await client.requestEmailVerification();
```

#### `verifyEmail(token: string): Promise<void>`

Verify email with token.

```typescript
await client.verifyEmail('verification-token');
```

### Profile

#### `getProfile(): Promise<UserProfile>`

Get user profile.

```typescript
const profile = await client.getProfile();
```

#### `updateProfile(data: UpdateProfileRequest): Promise<UserProfile>`

Update user profile.

```typescript
const profile = await client.updateProfile({
  display_name: 'John Doe',
  bio: 'Developer',
  avatar_url: 'https://example.com/avatar.jpg',
});
```

### Preferences

#### `getPreferences(): Promise<UserPreferences>`

Get user preferences.

```typescript
const prefs = await client.getPreferences();
```

#### `updatePreferences(data: UpdatePreferencesRequest): Promise<UserPreferences>`

Update user preferences.

```typescript
const prefs = await client.updatePreferences({
  theme: 'dark',
  language: 'en',
  timezone: 'America/New_York',
  notifications_enabled: true,
});
```

## Storage

### LocalStorage (default)

Uses browser's localStorage. Tokens persist across sessions.

```typescript
import { LocalStorage } from 'gouserfy-sdk';

const client = new GouserfyClient({
  baseURL: 'http://localhost:8080',
  storage: new LocalStorage(),
});
```

### MemoryStorage

Stores tokens in memory. Tokens are lost on page refresh.

```typescript
import { MemoryStorage } from 'gouserfy-sdk';

const client = new GouserfyClient({
  baseURL: 'http://localhost:8080',
  storage: new MemoryStorage(),
});
```

### Custom Storage

Implement `TokenStorage` interface for custom storage.

```typescript
import { TokenStorage } from 'gouserfy-sdk';

class CustomStorage implements TokenStorage {
  getAccessToken(): string | null { /* ... */ }
  setAccessToken(token: string): void { /* ... */ }
  getRefreshToken(): string | null { /* ... */ }
  setRefreshToken(token: string): void { /* ... */ }
  clear(): void { /* ... */ }
}

const client = new GouserfyClient({
  baseURL: 'http://localhost:8080',
  storage: new CustomStorage(),
});
```

## Error Handling

```typescript
import { GouserfyError } from 'gouserfy-sdk';

try {
  await client.login({ email: 'user@example.com', password: 'wrong' });
} catch (error) {
  if (error instanceof GouserfyError) {
    console.log('Status:', error.status);
    console.log('Message:', error.message);
  }
}
```

## TypeScript Types

All types are exported:

```typescript
import type {
  User,
  UserProfile,
  UserPreferences,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  // ... etc
} from 'gouserfy-sdk';
```

## License

MIT
