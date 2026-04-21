import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export type ApiErrorResponse = {
  success: false;
  error: ErrorCode;
  message: string;
  details?: { field: string; message: string }[];
};

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: 'Invalid request data',
  UNAUTHORIZED: 'Authentication required',
  FORBIDDEN: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource was not found',
  CONFLICT: 'Resource conflict',
  INTERNAL_ERROR: 'An unexpected error occurred',
};

export function errorResponse(
  code: ErrorCode,
  message?: string,
  status: number = 500,
  details?: { field: string; message: string }[]
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: code,
      message: message || ERROR_MESSAGES[code],
      ...(details && { details }),
    },
    { status }
  );
}

export function validationError(
  message: string = ERROR_MESSAGES.VALIDATION_ERROR,
  details?: { field: string; message: string }[]
): NextResponse<ApiErrorResponse> {
  return errorResponse('VALIDATION_ERROR', message, 400, details);
}

export function unauthorizedError(
  message: string = ERROR_MESSAGES.UNAUTHORIZED
): NextResponse<ApiErrorResponse> {
  return errorResponse('UNAUTHORIZED', message, 401);
}

export function forbiddenError(
  message: string = ERROR_MESSAGES.FORBIDDEN
): NextResponse<ApiErrorResponse> {
  return errorResponse('FORBIDDEN', message, 403);
}

export function notFoundError(
  message: string = ERROR_MESSAGES.NOT_FOUND
): NextResponse<ApiErrorResponse> {
  return errorResponse('NOT_FOUND', message, 404);
}

export function conflictError(
  message: string = ERROR_MESSAGES.CONFLICT
): NextResponse<ApiErrorResponse> {
  return errorResponse('CONFLICT', message, 409);
}

export function internalError(
  message: string = ERROR_MESSAGES.INTERNAL_ERROR,
  error?: unknown
): NextResponse<ApiErrorResponse> {
  console.error('Internal error:', error);
  return errorResponse('INTERNAL_ERROR', message, 500);
}

export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const details = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
  
  return validationError('Invalid request data', details);
}

export function isDatabaseConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505'
  );
}
