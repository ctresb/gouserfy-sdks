import type { TokenPair, TokenStorage } from './types'

export class LocalStorage implements TokenStorage {
  private key: string

  constructor(key = 'gouserfy_tokens') {
    this.key = key
  }

  get(): TokenPair | null {
    if (typeof window === 'undefined') return null
    const data = localStorage.getItem(this.key)
    if (!data) return null
    try {
      return JSON.parse(data)
    } catch {
      return null
    }
  }

  set(tokens: TokenPair): void {
    if (typeof window === 'undefined') return
    localStorage.setItem(this.key, JSON.stringify(tokens))
  }

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(this.key)
  }
}

export class MemoryStorage implements TokenStorage {
  private tokens: TokenPair | null = null

  get(): TokenPair | null {
    return this.tokens
  }

  set(tokens: TokenPair): void {
    this.tokens = tokens
  }

  clear(): void {
    this.tokens = null
  }
}
