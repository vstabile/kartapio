import { z } from 'zod';

export const venueSchema = z.object({
    name: z.string().min(1).max(50),
    about: z.string().min(0).max(200),
    picture: z.string().url().or(z.literal(''))
});

export const menuSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(50),
    description: z.string().min(0).max(200),
    currency: z.string().length(3)
});

export const idListSchema = z.array(z.string().uuid());

export const skListSchema = z.array(z.tuple([z.literal('sk'), z.string().length(64)]));

export type Venue = z.infer<typeof venueSchema>;

export type SkList = z.infer<typeof skListSchema>;

export type Menu = z.infer<typeof menuSchema>;

export type IdList = z.infer<typeof idListSchema>;
