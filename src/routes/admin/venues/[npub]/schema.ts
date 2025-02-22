import { z } from 'zod';

export const dishFormSchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().min(0).max(200),
    price: z.number().gt(0),
    images: z.array(z.string()).min(0).optional()
});

export const menuFormSchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().min(0).max(200)
});

export const newMenuSchema = z.object({
    name: z.string().min(1).max(50),
    description: z.string().min(0).max(200),
    currency: z.string().length(3)
});

export type FormSchema = typeof dishFormSchema;
