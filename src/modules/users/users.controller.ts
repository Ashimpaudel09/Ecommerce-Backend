import { Request, Response, NextFunction } from 'express';
import { updateRole as updateRoleService } from './users.service';
import { z } from 'zod';

const UpdateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

export const updateRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const parsed = UpdateRoleSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.format() });
    }

    const user = await updateRoleService(id, parsed.data.role);
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
