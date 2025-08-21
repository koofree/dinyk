export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
}

export interface CacheOptions {
  ttl?: number;
  maxSize?: number;
}

export class CacheManager {
  private cache = new Map<string, CacheEntry>();
  
  constructor(private options: CacheOptions = {}) {
    this.options.ttl = options.ttl || 60000;
    this.options.maxSize = options.maxSize || 100;
  }
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const entry = this.cache.get(key);
    
    if (entry && !this.isExpired(entry)) {
      return entry.data as T;
    }
    
    const data = await fetcher();
    this.set(key, data);
    return data;
  }
  
  set(key: string, data: any): void {
    if (this.cache.size >= (this.options.maxSize || 100)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
  
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }
  
  invalidate(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > (this.options.ttl || 60000);
  }
}