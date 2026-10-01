import { createHash } from 'crypto';
import { getCache, setCache, deleteCache, getVersion, incrementVersion } from './helper';

const VERSION_KEY = 'products:version';
const LIST_TTL = 300;    // 5 minutes for paginated lists
const SINGLE_TTL = 600;  // 10 minutes for single product

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

function hashQuery(query: Record<string, unknown>): string {
  const sorted = Object.keys(query)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = query[k];
      return acc;
    }, {});
  return createHash('sha256').update(JSON.stringify(sorted)).digest('hex').slice(0, 16);
}

async function getListCacheKey(query: Record<string, unknown>): Promise<string> {
  const version = await getVersion(VERSION_KEY);
  return `products:list:v${version}:${hashQuery(query)}`;
}

// ------------------------------------------------------------------
// Product list cache
// ------------------------------------------------------------------

export const getCachedProductList = async <T>(query: Record<string, unknown>): Promise<T | null> => {
  const key = await getListCacheKey(query);
  return getCache<T>(key);
};

export const setCachedProductList = async <T>(query: Record<string, unknown>, data: T): Promise<void> => {
  const key = await getListCacheKey(query);
  await setCache(key, data, LIST_TTL);
};

// ------------------------------------------------------------------
// Single product cache
// ------------------------------------------------------------------

export const getCachedProduct = async <T>(id: string): Promise<T | null> => {
  return getCache<T>(`product:${id}`);
};

export const setCachedProduct = async <T>(id: string, data: T): Promise<void> => {
  await setCache(`product:${id}`, data, SINGLE_TTL);
};

// ------------------------------------------------------------------
// Invalidation
// ------------------------------------------------------------------

/** Call after CREATE, UPDATE, or DELETE — bumps list version + removes single key */
export const invalidateProductCache = async (id?: string): Promise<void> => {
  await incrementVersion(VERSION_KEY); // all old list keys become unreachable
  if (id) {
    await deleteCache(`product:${id}`);
  }
};
