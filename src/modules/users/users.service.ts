import { prisma } from '../../lib/prisma';
import { AppError } from '../../errors/app.error';

export const updateRole = async (userId: string, role: 'CUSTOMER' | 'ADMIN') => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, email: true, role: true }
  });

  return updatedUser;
};
