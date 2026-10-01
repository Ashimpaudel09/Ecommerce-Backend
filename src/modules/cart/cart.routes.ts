import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import {
  addToCartHandler,
  getCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  clearCartHandler,
} from './cart.controller';

const router = Router();

// Require user to be logged in for all cart routes
router.use(requireAuth);

router.post('/', addToCartHandler);
router.get('/', getCartHandler);
router.patch('/:productId', updateCartItemHandler);
router.delete('/:productId', removeFromCartHandler);
router.delete('/', clearCartHandler);

export default router;
