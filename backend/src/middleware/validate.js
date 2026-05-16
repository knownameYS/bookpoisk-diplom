import { ZodError } from 'zod';
import { ApiError } from '../common/api-error.js';

function parseWithSchema(schema, value) {
  try {
    return schema.parse(value);
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.flatten();
      const firstFieldError = Object.values(details.fieldErrors)
        .flat()
        .find(Boolean);
      const firstFormError = details.formErrors.find(Boolean);
      throw ApiError.badRequest(firstFieldError || firstFormError || 'Validation error', details);
    }

    throw error;
  }
}

export function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = {
        body: schema.body ? parseWithSchema(schema.body, req.body) : req.body,
        query: schema.query ? parseWithSchema(schema.query, req.query) : req.query,
        params: schema.params ? parseWithSchema(schema.params, req.params) : req.params
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
