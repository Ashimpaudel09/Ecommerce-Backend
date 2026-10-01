import redis from './connection';

const DEFAULT_TTL = 300; // 5 minutes

export const setCache = async (key: string, value: unknown, ttlInSeconds = DEFAULT_TTL): Promise<void> => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlInSeconds);
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.get(key);
  if (!raw) return null;
  return JSON.parse(raw) as T;
};

export const deleteCache = async (key: string): Promise<void> => {
  await redis.del(key);
};

export const incrementVersion = async (versionKey: string): Promise<void> => {
  await redis.incr(versionKey);
};

export const getVersion = async (versionKey: string): Promise<string> => {
  return (await redis.get(versionKey)) ?? '0';
};


export const setHash = async (key: string, value: unknown, ttlInSeconds: number = DEFAULT_TTL): Promise<void> => {
  await redis.hset(key, value as Record<string, unknown>);
  await redis.expire(key, ttlInSeconds);
}

export const getHash = async <T>(key: string): Promise<T | null> => {
  const raw = await redis.hgetall(key);
  if (Object.keys(raw).length === 0) return null;
  return raw as T;
}
export const hgetHash = async <T>(key: string, field: string): Promise<T | null> => {
  const raw = await redis.hget(key, field);
  if (!raw) return null;
  return raw as T;
}

export const deleteHash = async (key: string): Promise<void> => {
  await redis.del(key);
}


