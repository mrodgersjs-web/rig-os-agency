// Simple in-memory rate limiter (for production: use Redis)
// Tracks requests per IP/token with sliding window

interface RateBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateBucket>();
const WINDOW_MS = 60_000; // 1 minute

export function rateLimit(
  key: string,
  limit: number = 100,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS };
  }

  bucket.count++;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

// Model request queue — prevents Ornith overload
// Only 1 concurrent request to local models, others queue

interface QueueItem {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
  fn: () => Promise<unknown>;
}

class ModelQueue {
  private active = 0;
  private queue: QueueItem[] = [];
  private maxConcurrent: number;

  constructor(maxConcurrent = 1) {
    this.maxConcurrent = maxConcurrent;
  }

  async run<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        resolve: resolve as (value: unknown) => void,
        reject,
        fn: fn as () => Promise<unknown>,
      });
      this.process();
    });
  }

  private async process() {
    if (this.active >= this.maxConcurrent) return;
    if (this.queue.length === 0) return;

    const item = this.queue.shift()!;
    this.active++;

    try {
      const result = await item.fn();
      item.resolve(result);
    } catch (e) {
      item.reject(e);
    } finally {
      this.active--;
      if (this.queue.length > 0) {
        this.process();
      }
    }
  }

  get stats() {
    return {
      active: this.active,
      queued: this.queue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }
}

// Local model queue (Ornith: 1 at a time)
export const localModelQueue = new ModelQueue(1);

// External model queue (Z.AI: 3 concurrent)
export const externalModelQueue = new ModelQueue(3);
