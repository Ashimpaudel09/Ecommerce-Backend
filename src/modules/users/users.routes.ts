import { Router } from 'express';
import { updateRole } from './users.controller';
import { requireAuth, requireAdmin } from '../../middleware/auth.middleware';

const usersRouter = Router();

// Only existing admins can change a user's role
usersRouter.put('/:id/role', requireAuth, requireAdmin, updateRole);

export default usersRouter;
