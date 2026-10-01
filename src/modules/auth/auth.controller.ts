import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { RegisterSchema, LoginSchema } from '../../types/auth';
import { logger } from '../../lib/logger';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = RegisterSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }

      const user = await authService.register(parsed.data);
      logger.info({ userId: user.id }, 'User registered successfully');
      return res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = LoginSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.format() });
      }

      const result = await authService.login(parsed.data);
      logger.info({ userId: result.user.id }, 'User logged in successfully');
      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
