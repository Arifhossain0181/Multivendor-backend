import { z } from 'zod';

export const updateFulfillmentSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid sub-order ID'),
  }),
  body: z.object({
    status: z.enum(['CONFIRMED', 'SHIPPED', 'DELIVERED']),
  }),
});