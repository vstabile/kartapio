import { writable } from 'svelte/store';

type CartItem = ['d', string, number];
export type Cart = CartItem[];

export const cart = writable<Cart>([]);
