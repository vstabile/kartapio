<script lang="ts">
    import { cart } from '$stores/cart';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { onMount } from 'svelte';
    import { LightningAddress } from '@getalby/lightning-tools';

    let launchPaymentModal: any;
    onMount(async () => {
        const alby = await import('@getalby/bitcoin-connect');
        launchPaymentModal = alby.launchPaymentModal;
    });
    async function startPayment() {
        const amount = 21;
        const address = import.meta.env.VITE_LIGHTNING_ADDRESS;
        const ln = new LightningAddress(address);
        await ln.fetch();
        const invoice = await ln.requestInvoice({ satoshi: amount });
        if (launchPaymentModal) {
            launchPaymentModal({
                invoice: invoice.paymentRequest,
                onPaid: ({ preimage }: { preimage: string }) => alert('Received payment! ' + preimage),
                onCancelled: () => alert('Payment cancelled')
            });
        }
    }

    $: total = $cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);
</script>

<div class="fixed bottom-0 left-0 right-0 border-t bg-white p-4 shadow-lg">
    <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div>
            <div class="text-sm">Total</div>
            <div class="text-lg font-semibold">
                R$ {total}
            </div>
        </div>
        <button
            class="rounded-full bg-primary px-6 py-2 text-white hover:bg-primary/90"
            on:click={startPayment}
        >
            Confirm
        </button>
    </div>
</div>
