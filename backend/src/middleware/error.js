import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      details: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Unique constraint failed',
        details: error.meta
      });
    }

    if (error.code === 'P2025') {
      return res.status(404).json({
        message: 'Record not found'
      });
    }
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal server error';

  if (statusCode >= 500) {
    console.error(error);
  }

  return res.status(statusCode).json({
    message,
    details: error.details
  });
}
