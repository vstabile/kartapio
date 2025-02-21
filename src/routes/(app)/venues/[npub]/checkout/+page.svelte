<script lang="ts">
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
</script>

<button on:click={startPayment}>Pay with Lightning ⚡</button>
