<script lang="ts">
    import { cart } from '$stores/cart';
</script>

<h1>Confirm your order details</h1>

<p>Order items</p>

{#each $cart as item}
    <div>
        <p>{item.name}</p>
        <p>R$ {item.price.toFixed(2)}</p>
        <p>{item.quantity}</p>
    </div>
{/each}
