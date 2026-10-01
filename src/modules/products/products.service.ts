import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { AppError } from '../../errors/app.error';
import {
  getCachedProductList,
  setCachedProductList,
  getCachedProduct,
  setCachedProduct,
  invalidateProductCache,
} from '../../cache/products.cache';
import { CreateProductInput, UpdateProductInput, ProductQuery } from '../../types/products';

const productSelect = {
  id: true,
  name: true,
  description: true,
  priceCents: true,
  stock: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: { id: true, name: true, slug: true },
  },
} as const;

// ------------------------------------------------------------------
// Get paginated list with filters
// ------------------------------------------------------------------

export const getProducts = async (query: ProductQuery) => {
  const cacheKey = query as Record<string, unknown>;
  const cached = await getCachedProductList(cacheKey);
  if (cached) {
    logger.info({ query }, 'Product list cache hit');
    return cached;
  }

  const { page, limit, categoryId, minPrice, maxPrice, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * limit;

  const where = {
    ...(categoryId && { categoryId }),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? {
        priceCents: {
          ...(minPrice !== undefined && { gte: minPrice }),
          ...(maxPrice !== undefined && { lte: maxPrice }),
        },
      }
      : {}),
    ...(search && {
      name: { contains: search, mode: 'insensitive' as const },
    }),
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where,
      select: productSelect,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    }),
    prisma.product.count({ where }),
  ]);

  const result = {
    data: products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };

  await setCachedProductList(cacheKey, result);
  return result;
};

// ------------------------------------------------------------------
// Get single product by ID
// ------------------------------------------------------------------

export const getProductById = async (id: string) => {
  const cached = await getCachedProduct(id);
  if (cached) {
    logger.info({ id }, 'Product cache hit');
    return cached;
  }

  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect,
  });

  if (!product) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  await setCachedProduct(id, product);
  return product;
};

// ------------------------------------------------------------------
// Create product
// ------------------------------------------------------------------

export const createProduct = async (data: CreateProductInput) => {
  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
  }

  const product = await prisma.product.create({
    data,
    select: productSelect,
  });

  await invalidateProductCache();
  logger.info({ productId: product.id }, 'Product created, list cache invalidated');
  return product;
};

// ------------------------------------------------------------------
// Update product
// ------------------------------------------------------------------

export const updateProduct = async (id: string, data: UpdateProductInput) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404, 'NOT_FOUND');
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data,
    select: productSelect,
  });

  await invalidateProductCache(id);
  logger.info({ productId: id }, 'Product updated, cache invalidated');
  return product;
};

// ------------------------------------------------------------------
// Delete product
// ------------------------------------------------------------------

export const deleteProduct = async (id: string) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError('Product not found', 404, 'NOT_FOUND');
  }

  await prisma.product.delete({ where: { id } });
  await invalidateProductCache(id);
  logger.info({ productId: id }, 'Product deleted, cache invalidated');
};

// ------------------------------------------------------------------
// Get all categories
// ------------------------------------------------------------------

export const getCategories = async () => {
  return prisma.category.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true },
  });
};
