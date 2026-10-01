import { Router } from 'express';
import {
  listProducts,
  listCategories,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from './products.controller';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';

const productsRouter = Router();

// Public routes — no auth required
productsRouter.get('/', listProducts);
productsRouter.get('/categories', listCategories);
productsRouter.get('/:id', getProduct);

// Admin-only routes
productsRouter.post('/', requireAuth, requireAdmin, createProductHandler);
productsRouter.put('/:id', requireAuth, requireAdmin, updateProductHandler);
productsRouter.delete('/:id', requireAuth, requireAdmin, deleteProductHandler);

export default productsRouter;
