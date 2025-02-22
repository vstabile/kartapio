<script lang="ts">
    import Button from '$components/ui/button/button.svelte';
    import { cart } from '$stores/cart';
    import type { Product } from '$stores/venues';

    export let product: Product;

    $: quantity = $cart.find((item) => item.id === product.id)?.quantity ?? 0;

    function remove() {
        if (quantity > 0) {
            cart.update((cart) => {
                if (cart.find((item) => item.id === product.id)) {
                    if (quantity === 1) return cart.filter((item) => item.id !== product.id);

                    return cart.map((item) =>
                        item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item
                    );
                } else {
                    return cart;
                }
            });
        }
    }

    function add() {
        cart.update((cart) => {
            if (cart.find((item) => item.id === product.id)) {
                return cart.map((item) =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            } else {
                // TODO: Get product details from parent component
                return [
                    ...cart,
                    {
                        id: product.id,
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        images: product.images,
                        quantity: 1
                    }
                ];
            }
        });
    }
</script>

<div>
    <Button style="background-color: rgba(26, 71, 42, 1);color: rgba(232, 213, 181, 1);" variant="outline" class="ml-4 h-6 w-6 rounded-full px-2" on:click={remove}>-</Button>
    <span class="px-1 text-center">{quantity}</span>
    <Button style="background-color: rgba(26, 71, 42, 1);color: rgba(232, 213, 181, 1);" variant="outline" class="h-6 w-6 rounded-full px-2" on:click={add}>+</Button>
</div>
