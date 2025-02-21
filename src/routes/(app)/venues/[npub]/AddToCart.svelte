<script lang="ts">
    import Button from '$components/ui/button/button.svelte';
    import { cart } from '$stores/cart';

    export let productId: string;

    $: quantity = $cart.find((item) => item[1] === productId)?.[2] ?? 0;

    function remove() {
        if (quantity > 0) {
            cart.update((cart) => {
                if (cart.find((item) => item[1] === productId)) {
                    if (quantity === 1) return cart.filter((item) => item[1] !== productId);

                    return cart.map((item) =>
                        item[1] === productId ? ['d', productId, item[2] - 1] : item
                    );
                } else {
                    return cart;
                }
            });
        }
    }

    function add() {
        cart.update((cart) => {
            if (cart.find((item) => item[1] === productId)) {
                return cart.map((item) =>
                    item[1] === productId ? ['d', productId, item[2] + 1] : item
                );
            } else {
                return [...cart, ['d', productId, 1]];
            }
        });
    }
</script>

<div>
    <Button variant="outline" class="ml-4 h-6 w-6 rounded-full px-2" on:click={remove}>-</Button>
    <span class="px-1 text-center">{quantity}</span>
    <Button variant="outline" class="h-6 w-6 rounded-full px-2" on:click={add}>+</Button>
</div>
