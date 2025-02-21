import { persisted } from 'svelte-persisted-store';

export interface CartItem {
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    quantity: number;
}

export type Cart = CartItem[];

export const cart = persisted<Cart>('cart', []);
