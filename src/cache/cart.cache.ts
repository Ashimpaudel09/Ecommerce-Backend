import redis from './connection';
import { CartItem } from '../types/cart';

const CART_TTL = 60 * 60 * 24 * 7; // 7 days

const getCartItemKey = (userId: string, productId: string) => `cart:${userId}:${productId}`;
const getCartIndexKey = (userId: string) => `cart:index:${userId}`;

export const addOrUpdateCartItem = async (userId: string, productId: string, quantity: number, increment: boolean = true) => {
  const itemKey = getCartItemKey(userId, productId);
  const indexKey = getCartIndexKey(userId);
  
  if (increment) {
    await redis.hincrby(itemKey, 'quantity', quantity);
  } else {
    await redis.hset(itemKey, { quantity });
  }
  
  await redis.hset(itemKey, { productId });
  
  await redis.sadd(indexKey, itemKey);
  
  // Reset TTLs
  await redis.expire(itemKey, CART_TTL);
  await redis.expire(indexKey, CART_TTL);
};

export const getCartItem = async (userId: string, productId: string): Promise<CartItem | null> => {
  const itemKey = getCartItemKey(userId, productId);
  const raw = await redis.hgetall(itemKey);
  
  if (Object.keys(raw).length === 0) return null;
  
  return {
    productId: raw.productId,
    quantity: parseInt(raw.quantity, 10)
  };
};

export const removeCartItem = async (userId: string, productId: string) => {
  const itemKey = getCartItemKey(userId, productId);
  const indexKey = getCartIndexKey(userId);
  
  await redis.del(itemKey);
  await redis.srem(indexKey, itemKey);
};

export const getAllCartItems = async (userId: string): Promise<CartItem[]> => {
  const indexKey = getCartIndexKey(userId);
  const itemKeys = await redis.smembers(indexKey);
  
  if (itemKeys.length === 0) return [];
  
  const pipeline = redis.pipeline();
  itemKeys.forEach(key => pipeline.hgetall(key));
  
  const results = await pipeline.exec();
  
  const items: CartItem[] = [];
  if (results) {
    for (const [err, raw] of results) {
      if (err) continue;
      const data = raw as Record<string, string>;
      if (Object.keys(data).length > 0) {
        items.push({
          productId: data.productId,
          quantity: parseInt(data.quantity, 10)
        });
      }
    }
  }
  
  return items;
};

export const clearCart = async (userId: string) => {
  const indexKey = getCartIndexKey(userId);
  const itemKeys = await redis.smembers(indexKey);
  
  if (itemKeys.length > 0) {
    const pipeline = redis.pipeline();
    itemKeys.forEach(key => pipeline.del(key));
    pipeline.del(indexKey);
    await pipeline.exec();
  }
};
