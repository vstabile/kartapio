import { z } from 'zod';

export const formSchema = z.object({
    name: z.string().min(1).max(50),
    about: z.string().min(0).max(200),
    image: z.string().url()
});

export type FormSchema = typeof formSchema;
