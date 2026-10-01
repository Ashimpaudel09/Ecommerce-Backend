import { Request, Response, NextFunction } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from './products.service';
import {
  CreateProductSchema,
  UpdateProductSchema,
  ProductQuerySchema,
} from '../../types/products';

// GET /api/products  (public)
export const listProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ProductQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    const result = await getProducts(parsed.data);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// GET /api/products/categories  (public)
export const listCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await getCategories();
    return res.status(200).json({ data: categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/products/:id  (public)
export const getProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const product = await getProductById(id);
    return res.status(200).json({ data: product });
  } catch (error) {
    next(error);
  }
};

// POST /api/products  (admin only)
export const createProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = CreateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    const product = await createProduct(parsed.data);
    return res.status(201).json({ data: product });
  } catch (error) {
    next(error);
  }
};

// PUT /api/products/:id  (admin only)
export const updateProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = UpdateProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }
    const product = await updateProduct(id, parsed.data);
    return res.status(200).json({ data: product });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/products/:id  (admin only)
export const deleteProductHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    await deleteProduct(id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
};
