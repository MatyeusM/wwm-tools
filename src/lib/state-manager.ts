import { MessagePackEncoder, MessagePackDecoder } from '@jsonjoy.com/json-pack/lib/msgpack'

const encoder = new MessagePackEncoder()
const decoder = new MessagePackDecoder()

export type State = Map<string, any>
type Subscriber = (state: State) => void

/**
 * Converts a Uint8Array to a URL-safe Base64 string.
 */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Converts a URL-safe Base64 string back to a Uint8Array.
 */
function fromBase64(base64: string): Uint8Array {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

export class StateManager {
  private keys: string[]
  private state: State
  private subs = new Set<Subscriber>()
  private storageKey: string
  private committing = false
  private commitTimeout: any = null

  constructor(initial: State, storageKey = 'state') {
    this.storageKey = storageKey
    this.keys = [...initial.keys()]
    this.state = new Map()

    const fromUrl = this.loadFromUrl()
    const fromLs = this.loadFromLocalStorage()

    const seed = fromUrl ?? fromLs ?? initial

    for (const [k, v] of seed.entries()) {
      if (this.keys.includes(k)) {
        this.state.set(k, this.wrapDeep(v))
      }
    }

    // Ensure state is complete with initial values for any missing keys
    for (const k of this.keys) {
      if (!this.state.has(k)) {
        this.state.set(k, this.wrapDeep(initial.get(k)))
      }
    }

    this.commit()
  }

  subscribe(fn: Subscriber): () => void {
    this.subs.add(fn)
    return () => this.subs.delete(fn)
  }

  get<T = any>(key: string): T {
    return this.state.get(key)
  }

  set<T>(key: string, value: T) {
    if (!this.keys.includes(key)) return
    this.state.set(key, this.wrapDeep(value))
    this.commit()
  }

  getState(): State {
    return new Map(this.state)
  }

  entries() {
    return this.state.entries()
  }

  private notify() {
    for (const s of this.subs) s(this.state)
  }

  private encodeValues(): string {
    const values = this.keys.map(k => this.state.get(k))
    const binary = encoder.encode(values)
    return toBase64(binary)
  }

  private decodeValues(encoded: string): State | null {
    try {
      const bytes = fromBase64(encoded)
      const values = decoder.decode(bytes) as any[]
      const m = new Map<string, any>()

      for (let i = 0; i < this.keys.length; i++) {
        if (i < values.length) {
          m.set(this.keys[i], values[i])
        }
      }

      return m
    } catch {
      return null
    }
  }

  private commit() {
    if (this.committing) return
    this.committing = true

    try {
      const encoded = this.encodeValues()

      // 1. Debounce URL updates to prevent browser throttling
      clearTimeout(this.commitTimeout)
      this.commitTimeout = setTimeout(() => {
        history.replaceState(null, '', '#' + encoded)
      }, 100)

      // 2. Sync LocalStorage immediately (fast)
      const plain: Record<string, any> = {}
      for (const [k, v] of this.state) plain[k] = v
      localStorage.setItem(this.storageKey, JSON.stringify(plain))

      this.notify()
    } finally {
      this.committing = false
    }
  }

  private loadFromUrl(): State | null {
    const h = location.hash.slice(1)
    if (!h) return null
    return this.decodeValues(h)
  }

  private loadFromLocalStorage(): State | null {
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) return null
    try {
      const parsed = JSON.parse(raw)
      const m = new Map<string, any>()
      for (const k of Object.keys(parsed)) {
        if (this.keys.includes(k)) {
          m.set(k, parsed[k])
        }
      }
      return m
    } catch {
      return null
    }
  }

  private wrapDeep<T>(value: T): T {
    if (!value || typeof value !== 'object') return value

    const self = this
    const handler: ProxyHandler<any> = {
      set(target, prop, val) {
        target[prop] = self.wrapDeep(val)
        self.commit()
        return true
      },
      deleteProperty(target, prop) {
        delete target[prop]
        self.commit()
        return true
      },
    }

    if (Array.isArray(value)) {
      return new Proxy(
        value.map(v => this.wrapDeep(v)),
        handler,
      ) as any
    }

    const obj: any = {}
    for (const k of Object.keys(value as any)) {
      obj[k] = this.wrapDeep((value as any)[k])
    }
    return new Proxy(obj, handler)
  }
}
