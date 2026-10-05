import { z } from 'zod';

export const createReturnSchema = z.object({
  body: z.object({
    subOrderId: z.string().min(1, 'Invalid sub-order ID'),
    reason: z.string().min(5, 'Please provide a reason for return').max(500),
    requestedQty: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
});

export const resolveReturnSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid return request ID'),
  }),
  body: z.object({
    action: z.enum(['approve', 'reject']),
    note: z.string().optional(),
  }),
});

export const createDisputeSchema = z.object({
  params: z.object({
    returnId: z.string().min(1, 'Invalid return request ID'),
  }),
  body: z.object({
    resolution: z.string().min(5, 'Resolution note is required'),
  }),
});

export const processRefundSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Invalid return request ID'),
  }),
});
