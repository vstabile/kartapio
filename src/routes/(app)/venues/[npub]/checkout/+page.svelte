<script lang="ts">
    import { page } from '$app/stores';
    import { cart } from '$stores/cart';
    import { LucideImage } from 'lucide-svelte';
    import LucideArrowLeft from '~icons/lucide/arrow-left';
    import LucideMapPin from '~icons/lucide/map-pin';
    import LucideBitcoin from '~icons/lucide/bitcoin';
    import LucideCreditCard from '~icons/lucide/credit-card';
    import LucideBanknote from '~icons/lucide/banknote';
    import * as RadioGroup from '$lib/components/ui/radio-group/index.js';
    import Label from '$components/ui/label/label.svelte';
    import Confirm from './Confirm.svelte';
    import Button from '$components/ui/button/button.svelte';
    import { goto } from '$app/navigation';
    import { NDKEvent, NDKUser } from '@nostr-dev-kit/ndk';
    import ndk from '$stores/ndk';
    import { onMount } from 'svelte';
    import session from '$stores/session';

    let subscribed = false;
    let waiting = false;
    const address = 'Rodovia SC 401, 4100 - Km4 - Saco Grande, Florianópolis - SC, 88032-005';

    let launchPaymentModal: any;
    onMount(async () => {
        const alby = await import('@getalby/bitcoin-connect');
        launchPaymentModal = alby.launchPaymentModal;
    });

    $: parentPath = $page.url.pathname.split('/').slice(0, -1).join('/');

    $: if (!subscribed && $session.user?.pubkey) {
        subscribed = true;
        const sub = $ndk.subscribe({
            kinds: [4],
            '#p': [$session.user!.pubkey],
            since: Math.floor(Date.now() / 1000)
        });

        sub.on('event', async (event: NDKEvent) => {
            console.log(event);

            await event.decrypt(new NDKUser({ pubkey: event.pubkey }), $ndk.signer);

            const content = JSON.parse(event.content);
            const invoice = get_link(content.payment_options, 'ln');

            if (invoice) {
                startPayment(invoice);
            }

            console.log(content);
            waiting = false;
        });
    }

    async function startPayment(invoice: string) {
        if (launchPaymentModal) {
            launchPaymentModal({
                invoice: invoice,
                onPaid: ({ preimage }: { preimage: string }) =>
                    console.debug('Received payment! ' + preimage),
                onCancelled: () => alert('Payment cancelled')
            });
        }
    }

    function get_link(
        payment_options: { type: string; link?: string }[],
        type: string
    ): string | null {
        const option = payment_options.find((option) => option.type === type);
        return option?.link || null;
    }
</script>

<div
    style="background-color: rgba(255, 248, 235, 1);"
    class="h-full bg-gray-50 px-4 py-6 sm:px-6 sm:pt-10"
>
    <Button
        variant="outline"
        style="background-color: rgba(0, 0, 0, 0.06); color: black;"
        class="mb-4 mt-[-10px] h-10 w-10 rounded-full p-0 text-muted-foreground"
        on:click={() => goto(parentPath)}
    >
        <LucideArrowLeft />
    </Button>

    <h1 class="mb-6 text-2xl font-bold text-black" style="font-size: xx-large;">
        Confirm your order details
    </h1>

    <h2 class="mb-4 text-lg font-medium" style="color: rgba(0, 0, 0, 0.6);">Order details</h2>

    <div class="grid gap-4 pb-4 pt-2">
        {#each $cart as item (item.id)}
            <div
                class="flex items-center gap-4 rounded-2xl p-4"
                style="background-color: rgb(0 0 0 / 6%)"
            >
                {#if item.images?.length > 0}
                    <img
                        src={item.images.at(0)}
                        alt={item.name}
                        class="h-16 w-16 rounded-lg object-cover"
                    />
                {:else}
                    <LucideImage class="h-16 w-16 rounded-lg text-gray-400" />
                {/if}
                <div class="flex flex-1 flex-col text-black">
                    <p class="text-sm font-bold">{item.name}</p>
                    <p class="text-[11px] text-black">{item.description}</p>
                </div>
                <div class="min-w-max text-right">
                    <span class="text-sm text-gray-500">{item.quantity}x</span>
                    <span class="text-sm font-bold"> R$ {`${item.price}`}</span>
                </div>
            </div>
        {/each}
        <button
            class="text-sm text-primary"
            style="color: rgba(26, 71, 42, 1);font-weight: bold;text-align:start;"
            on:click={() => {
                $cart = [];
                goto(parentPath);
            }}>Empty cart</button
        >
    </div>

    <div
        class="flex items-center justify-between rounded-lg border p-4"
        style="background-color: rgb(0 0 0 / 6%)"
    >
        <!-- Ícone à esquerda -->
        <LucideMapPin class="h-8 w-8 text-black" />

        <!-- Textos à direita, organizados em coluna -->
        <div class="flex flex-col text-right">
            <h2
                class="text-lg font-medium text-black"
                style="text-align: start; font-weight: bold;"
            >
                Delivery address
            </h2>
            <div class="text-sm text-black">{address}</div>
        </div>
    </div>

    <h2 class="mb-4 mt-6 text-lg font-medium text-black">Payment method</h2>
    <RadioGroup.Root value="bitcoin" class="grid gap-4">
        <div
            class="flex items-center justify-between rounded-lg border p-4"
            style="background-color: rgb(0 0 0 / 6%)"
        >
            <Label for="bitcoin" class="flex w-full items-center gap-2 text-black">
                <LucideBitcoin class="h-6 w-6" /> Bitcoin
            </Label>
            <RadioGroup.Item value="bitcoin" id="bitcoin" style="color:aqua;"/>
        </div>
        <div
            class="flex items-center justify-between rounded-lg border p-4"
            style="background-color: rgb(0 0 0 / 6%)"
        >
            <Label for="credit-card" class="flex w-full items-center gap-2 text-black">
                <LucideCreditCard class="h-6 w-6" /> Credit Card
            </Label>
            <RadioGroup.Item value="credit-card" id="credit-card" />
        </div>
        <div
            class="flex items-center justify-between rounded-lg border p-4"
            style="background-color: rgb(0 0 0 / 6%)"
        >
            <Label for="option-three" class="flex w-full items-center gap-2 text-black">
                <LucideBanknote class="h-6 w-6" /> Cash
            </Label>
            <RadioGroup.Item value="option-three" id="option-three" />
        </div>
    </RadioGroup.Root>
    <br /><br /><br />
    <br />
    <Confirm {address} bind:waiting />
</div>
