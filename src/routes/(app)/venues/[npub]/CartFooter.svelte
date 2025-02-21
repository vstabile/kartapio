<script lang="ts">
    import { cart } from '$stores/cart';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';

    $: total = $cart.reduce((sum, [, , quantity]) => sum + quantity, 0);
</script>

<div class="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div class="text-lg font-semibold">
            Total Items: {total}
        </div>
        <button
            class="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
            on:click={() => goto(`${$page.url.pathname}/checkout`)}
        >
            Checkout
        </button>
    </div>
</div>
