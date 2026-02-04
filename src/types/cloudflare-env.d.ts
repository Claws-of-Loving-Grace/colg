type D1PreparedStatementLike = {
  bind: (...values: unknown[]) => {
    run: () => Promise<unknown>;
    all: <T = unknown>() => Promise<{ results: T[] }>;
    first: <T = unknown>() => Promise<T | null>;
  };
};

type D1DatabaseLike = {
  prepare: (query: string) => D1PreparedStatementLike;
};

type KVNamespaceLike = {
  get: (key: string) => Promise<string | null>;
  put: (
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ) => Promise<void>;
};

declare global {
  interface CloudflareEnv {
    DB: D1DatabaseLike;
    RATE_LIMIT: KVNamespaceLike;
    OPENAI_API_KEY?: string;
    SCAN_DISABLE?: string;
    ADMIN_API_KEYS?: string;
  }
}

export {};
