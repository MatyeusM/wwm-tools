import { MessagePackEncoder, MessagePackDecoder } from '@jsonjoy.com/json-pack/lib/msgpack'

const encoder = new MessagePackEncoder()
const decoder = new MessagePackDecoder()

export type State = Map<string, unknown>
type Subscriber = (state: State) => void

/**
 * Converts a Uint8Array to a URL-safe Base64 string.
 */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const length = bytes.byteLength
  for (let index = 0; index < length; index++) {
    binary += String.fromCodePoint(bytes[index])
  }
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/={0,2}$/, '')
}

/**
 * Converts a URL-safe Base64 string back to a Uint8Array.
 */
function fromBase64(base64: string): Uint8Array {
  const normalized = base64.replaceAll('-', '+').replaceAll('_', '/')
  const binary = atob(normalized)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.codePointAt(index) ?? 0
  }
  return bytes
}

export class StateManager {
  private keys: string[]
  private state: State
  private subs = new Set<Subscriber>()
  private storageKey: string
  private committing = false
  private commitTimeout: ReturnType<typeof setTimeout> | undefined = undefined

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

  subscribe(function_: Subscriber): () => void {
    this.subs.add(function_)
    return () => this.subs.delete(function_)
  }

  get<T = unknown>(key: string): T {
    return this.state.get(key) as T
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

  private decodeValues(encoded: string): State | undefined {
    try {
      const bytes = fromBase64(encoded)
      const values = decoder.decode(bytes) as unknown[]
      const m = new Map<string, unknown>()

      for (let index = 0; index < this.keys.length; index++) {
        if (index < values.length) {
          m.set(this.keys[index], values[index])
        }
      }

      return m
    } catch {
      return undefined
    }
  }

  private commit() {
    if (this.committing) return
    this.committing = true

    try {
      const encoded = this.encodeValues()

      // 1. Debounce URL updates to prevent browser throttling
      clearTimeout(this.commitTimeout ?? undefined)
      this.commitTimeout = setTimeout(() => {
        history.replaceState(undefined, '', '#' + encoded)
      }, 100)

      // 2. Sync LocalStorage immediately (fast)
      const plain: Record<string, unknown> = {}
      for (const [k, v] of this.state) plain[k] = v
      localStorage.setItem(this.storageKey, JSON.stringify(plain))

      this.notify()
    } finally {
      this.committing = false
    }
  }

  private loadFromUrl(): State | undefined {
    const h = location.hash.slice(1)
    if (!h) return undefined
    return this.decodeValues(h)
  }

  private loadFromLocalStorage(): State | undefined {
    const raw = localStorage.getItem(this.storageKey)
    if (!raw) return undefined
    try {
      const parsed = JSON.parse(raw)
      const m = new Map<string, unknown>()
      for (const k of Object.keys(parsed)) {
        if (this.keys.includes(k)) {
          m.set(k, parsed[k])
        }
      }
      return m
    } catch {
      return undefined
    }
  }

  private wrapDeep<T>(value: T): T {
    if (!value || typeof value !== 'object') return value

    const handler: ProxyHandler<object> = {
      set: (target, property, value_) => {
        ;(target as Record<string | symbol, unknown>)[property] = this.wrapDeep(value_)
        this.commit()
        return true
      },
      deleteProperty: (target, property) => {
        delete (target as Record<string | symbol, unknown>)[property]
        this.commit()
        return true
      },
    }

    if (Array.isArray(value)) {
      return new Proxy(
        value.map(v => this.wrapDeep(v)),
        handler,
      ) as T
    }

    const object: Record<string, unknown> = {}
    for (const k of Object.keys(value as object)) {
      object[k] = this.wrapDeep((value as Record<string, unknown>)[k])
    }
    return new Proxy(object, handler) as T
  }
}
