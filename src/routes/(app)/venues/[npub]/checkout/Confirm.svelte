<script lang="ts">
    import { page } from '$app/stores';
    import { cart } from '$stores/cart';
    import ndk from '$stores/ndk';
    import session from '$stores/session';
    import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
    import { nip19 } from 'nostr-tools';
    import { v4 as uuidv4 } from 'uuid';

    export let address: string;

    const venueNpub = $page.params.npub;
    const venuePubkey = nip19.decode(venueNpub).data as string;

    $: total = $cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2);

    async function placeOrder() {
        let order = {
            id: uuidv4(),
            type: 0,
            name: '',
            address,
            message: '',
            contact: {
                nostr: $session.user!.pubkey
            },
            items: $cart.map((item) => ({ product_id: item.id, quantity: item.quantity }))
        };

        const orderEvent = new NDKEvent($ndk, {
            pubkey: $session.user!.pubkey,
            content: JSON.stringify(order),
            created_at: Math.floor(Date.now() / 1000),
            kind: 4,
            tags: [['p', venuePubkey]]
        });

        await orderEvent.encrypt(new NDKUser({ pubkey: venuePubkey }));
        await orderEvent.sign($ndk.signer);
        await orderEvent.publish();
    }
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
            on:click={placeOrder}
        >
            Confirm
        </button>
    </div>
</div>
