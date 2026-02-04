type D1DatabaseLike = {
  prepare: (query: string) => {
    bind: (...values: unknown[]) => { run: () => Promise<unknown> };
  };
};

type KVNamespaceLike = {
  get: (key: string) => Promise<string | null>;
  put: (key: string, value: string, options?: { expirationTtl?: number }) => Promise<void>;
};

declare global {
  interface CloudflareEnv {
    DB: D1DatabaseLike;
    RATE_LIMIT: KVNamespaceLike;
    OPENAI_API_KEY?: string;
    SCAN_DISABLE?: string;
  }
}

export {};
