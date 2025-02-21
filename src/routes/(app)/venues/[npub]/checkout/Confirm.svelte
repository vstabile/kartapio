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
    async function startPayment(amount) {
        console.log(amount);
        const address = import.meta.env.VITE_LIGHTNING_ADDRESS;
        const ln = new LightningAddress(address);
        await ln.fetch();
        const invoice = await ln.requestInvoice({ satoshi: amount });
        if (launchPaymentModal) {
            launchPaymentModal({
                invoice: invoice.paymentRequest,
                onPaid: ({ preimage }: { preimage: string }) =>
                    alert('Received payment! ' + preimage),
                onCancelled: () => alert('Payment cancelled')
            });
        }
    }

    /**
     * Converts a given amount in Brazilian Reais (BRL) to Satoshis (sats).
     * @param amountInBRL - The amount in BRL to convert.
     * @returns The equivalent amount in Satoshis.
     */
    export async function convertBRLtoSats(amountInBRL: number): Promise<number> {
        try {
            // Fetch Bitcoin price in BRL from CoinGecko API
            const response = await fetch(
                'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl'
            );

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            const btcPriceInBRL = data.bitcoin.brl;

            // Convert BRL to BTC
            const amountInBTC = amountInBRL / btcPriceInBRL;

            // Convert BTC to Satoshis (1 BTC = 100,000,000 sats)
            return Math.round(amountInBTC * 100_000_000);
        } catch (error) {
            console.error('Error fetching BTC price:', error);
            throw new Error('Failed to convert BRL to Satoshis.');
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
            on:click={async () => {
                const total_in_sats = await convertBRLtoSats(parseFloat(total));
                startPayment(total_in_sats);
            }}
        >
            Confirm
        </button>
    </div>
</div>
