import { z } from 'zod';
import { nip19 } from 'nostr-tools';

const usernameRegex = /^(?![\d.-_])(?!.*\.\.)[a-z][a-z0-9._-]*[a-z0-9]?$/;

const usernameSchema = z.string().min(1).max(20).regex(usernameRegex, {
    message: 'Username is not valid'
});

const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(50, 'Password must be at most 50 characters long');
// .superRefine((value, ctx) => {
//     if (!/[A-Z]/.test(value)) {
//         ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             message: 'Password must contain at least one uppercase letter'
//         });
//     }
//     if (!/[a-z]/.test(value)) {
//         ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             message: 'Password must contain at least one lowercase letter'
//         });
//     }
//     if (!/\d/.test(value)) {
//         ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             message: 'Password must contain at least one number'
//         });
//     }
//     if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
//         ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             message: 'Password must contain at least one special character'
//         });
//     }
// });

export const signInSchema = z.object({
    username: usernameSchema,
    password: passwordSchema
});

export const signUpSchema = z.object({
    username: usernameSchema,
    email: z.string().email()
    // password: passwordSchema,
    // confirmPassword: z.string()
});
// .superRefine((data, ctx) => {
//     if (data.password !== data.confirmPassword) {
//         ctx.addIssue({
//             code: z.ZodIssueCode.custom,
//             path: ['confirmPassword'],
//             message: "Passwords don't match"
//         });
//     }
// });

export const nsecSchema = z.object({
    key: z
        .string()
        .startsWith('nsec1')
        .length(5 + 58)
        .refine(
            (key) => {
                try {
                    const result = nip19.decode(key);
                    return result.type === 'nsec';
                } catch (e) {
                    return false;
                }
            },
            {
                message: 'This is not a valid nsec key'
            }
        )
});

export const npubSchema = z.object({
    key: z
        .string()
        .startsWith('npub1')
        .length(5 + 58)
        .refine(
            (key) => {
                try {
                    const result = nip19.decode(key);
                    return result.type === 'npub';
                } catch (e) {
                    return false;
                }
            },
            {
                message: 'This is not a valid npub key'
            }
        )
});
