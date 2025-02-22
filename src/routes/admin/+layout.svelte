<script lang="ts">
    import '/src/app.css';
    import { onMount } from 'svelte';
    import ndk from '$stores/ndk';
    import signIn from '$utils/sign-in';
    import Navbar from '$components/admin/Navbar.svelte';
    import { NDKEvent, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
    import venues from '$stores/venues';
    import { toast } from 'svelte-sonner';
    import { LightningAddress } from '@getalby/lightning-tools';

    let subscribed = false;

    $: venuePubkeys = $venues.map((venue) => venue.pubkey);
    $: venueKeys = Object.fromEntries($venues.map((venue) => [venue.pubkey, venue.hexkey]));

    $: if (!subscribed && venuePubkeys.length > 0) {
        subscribed = true;
        // Subscribe to customer orders
        const sub = $ndk.subscribe({
            kinds: [4],
            '#p': venuePubkeys,
            since: Math.floor(Date.now() / 1000)
        });

        sub.on('event', async (event: NDKEvent) => {
            const pubkey = event.tags.find((t: any) => t[0] === 'p')?.[1];
            if (!pubkey) return;

            await event.decrypt(
                new NDKUser({ pubkey: event.pubkey }),
                new NDKPrivateKeySigner(venueKeys[pubkey])
            );

            const content = JSON.parse(event.content);

            toast.success('A new order has been received', {
                description: `Delivery at: ${content.address}`
            });

            const amount = await calculateTotalPrice(content.items, $venues);
            console.log(amount)
            const lnInvoice = await generateInvoiceAddress(amount);

            // Send payment request event to customer
            const paymentRequest = {
                id: content.id,
                type: 1,
                message: '',
                payment_options: [
                    {
                        type: 'ln',
                        link: lnInvoice
                    },
                    {
                        type: 'creditCard'
                    },
                    {
                        type: 'cash'
                    }
                ]
            };

            const paymentRequestEvent = new NDKEvent($ndk, {
                pubkey,
                content: JSON.stringify(paymentRequest),
                created_at: Math.floor(Date.now() / 1000),
                kind: 4,
                tags: [['p', event.pubkey]]
            });

            await paymentRequestEvent.encrypt(
                new NDKUser({ pubkey: event.pubkey }),
                new NDKPrivateKeySigner(venueKeys[pubkey])
            );
            await paymentRequestEvent.sign(new NDKPrivateKeySigner(venueKeys[pubkey]));
            await paymentRequestEvent.publish();
        });
    }
    type ProductOrder = {
        product_id: string;
        quantity: number;
    };

    type VenueProduct = {
        id: string;
        price: number;
    };

    type Venue = {
        stalls: {
            products: VenueProduct[];
        }[];
    };

    async function calculateTotalPrice(products: ProductOrder[], venues: Venue[]): Promise<number> {
        let totalPrice = 0;

        for (const product of products) {
            for (const venue of venues) {
                for (const stall of venue.stalls) {
                    const foundProduct = stall.products.find((p) => p.id === product.product_id);
                    if (foundProduct) {
                        totalPrice += foundProduct.price * product.quantity;
                    }
                }
            }
        }

        const totalPriceInSats = await convertBRLtoSats(totalPrice);
        return totalPriceInSats;
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
    async function generateInvoiceAddress(amount: number) {
        const address = import.meta.env.VITE_LIGHTNING_ADDRESS;
        const ln = new LightningAddress(address);
        await ln.fetch();
        const invoice = await ln.requestInvoice({ satoshi: amount });
        return invoice.paymentRequest;
    }

    /**
     * Connects to the Nostr network and try to restore the user
     * session from the local storage.
     */
    onMount(async () => {
        // $ndk.cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'NostrMenu' });
        // $ndk.clientName = 'nostrMenu';

        // const sigWorker = import.meta.env.DEV ? new Worker(new URL('@nostr-dev-kit/ndk/workers/sig-verification?worker', import.meta.url), { type: 'module' }) : new NDKSigVerificationWorker();
        // $ndk.signatureVerificationWorker = sigWorker;
        await $ndk.connect(10000);

        await signIn();
    });
</script>

<Navbar />

<div class="h-full min-h-screen bg-purple-50 px-4 py-4 sm:px-10 sm:py-6">
    <slot />
</div>
