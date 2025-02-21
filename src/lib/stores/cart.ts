import { persisted } from 'svelte-persisted-store';

export interface CartItem {
    id: string;
    name: string;
    description: string;
    price: number;
    quantity: number;
    images: string[];
}

export type Cart = CartItem[];

export const cart = persisted<Cart>('cart', []);
