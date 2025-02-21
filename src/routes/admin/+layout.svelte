<script lang="ts">
    import '/src/app.css';
    import { onMount } from 'svelte';
    import ndk from '$stores/ndk';
    import signIn from '$utils/sign-in';
    import Navbar from '$components/admin/Navbar.svelte';
    import { NDKEvent, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
    import venues from '$stores/venues';

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

            // Send payment request event to customer
            const paymentRequest = {
                id: content.id,
                type: 1,
                message: '',
                payment_options: [
                    {
                        type: 'ln',
                        link: 'lninvoice'
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

            await paymentRequestEvent.encrypt(new NDKUser({ pubkey: event.pubkey }));
            await paymentRequestEvent.sign(new NDKPrivateKeySigner(venueKeys[pubkey]));
            await paymentRequestEvent.publish();
        });
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
