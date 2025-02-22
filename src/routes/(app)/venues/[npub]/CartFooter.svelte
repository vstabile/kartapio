<script lang="ts">
    import { cart } from '$stores/cart';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    $: total = $cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
</script>

<div class="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg" style="background-color: rgba(255, 248, 235, 1);">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div>
            <div class="text-sm" style="color: rgba(0, 0, 0, 0.6);">Total</div>
            <div class="text-lg font-semibold" >
                R$ {total}
            </div>
        </div>
        <button
            class="rounded-full bg-primary px-6 py-2 text-white hover:bg-primary/90"
            style="background-color: rgba(26, 71, 42, 1);font-weight:bold;color:rgb(255, 248, 235);"
            on:click={() => goto(`${$page.url.pathname}/checkout`)}
        >
            Checkout
        </button>
    </div>
</div>
