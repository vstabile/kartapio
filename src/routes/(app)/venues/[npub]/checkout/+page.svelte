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
    import type { NDKEvent } from '@nostr-dev-kit/ndk';
    import ndk from '$stores/ndk';
    import session from '$stores/session';

    const address = 'Rodovia SC 401, 4100 - Km4 - Saco Grande, Florianópolis - SC, 88032-005';

    $: parentPath = $page.url.pathname.split('/').slice(0, -1).join('/');

    $: if ($session.user) {
        const sub = $ndk.subscribe({
            kinds: [4],
            '#p': [$session.user!.pubkey],
            since: Math.floor(Date.now() / 1000)
        });

        sub.on('event', async (event: NDKEvent) => {
            console.log(event);
        });
    }
</script>

<Button
    variant="outline"
    class="mb-4 mt-[-10px] h-10 w-10 rounded-full p-0 text-muted-foreground"
    on:click={() => goto(parentPath)}
>
    <LucideArrowLeft />
</Button>

<h1 class="mb-6 text-2xl font-bold">Confirm your order details</h1>

<h2 class="mb-4 text-lg font-medium">Order items</h2>

{#each $cart as item (item.id)}
    <div class="flex items-center justify-between">
        <div class="flex items-center">
            <div>
                {#if item.images?.length > 0}
                    <img src={item.images.at(0)} alt={item.name} class="h-16 w-16 rounded-lg" />
                {:else}
                    <LucideImage class="h-10 w-10 rounded-lg text-gray-400" />
                {/if}
            </div>
            <div class="ml-3">
                <p class="text-sm font-medium leading-none">
                    {item.name}
                </p>
                <p class="text-sm text-muted-foreground">
                    {item.description}
                </p>
            </div>
        </div>
        <div class="flex justify-end">
            <div class="min-w-max">
                <span class="text-sm text-gray-500">{item.quantity}x</span> R$ {`${item.price}`}
            </div>
        </div>
    </div>
{/each}

<h2 class="mb-4 mt-6 text-lg font-medium">Delivery address</h2>

<div class="flex items-center space-x-2 rounded-lg border p-4">
    <LucideMapPin class="mr-2 h-8 w-8" />
    <div class="text-sm text-gray-500">
        {address}
    </div>
    <a href="#mock" class="text-sm text-primary">Change</a>
</div>

<h2 class="mb-4 mt-6 text-lg font-medium">Payment method</h2>

<RadioGroup.Root value="bitcoin">
    <div class="flex items-center justify-between rounded-lg border p-4">
        <Label for="bitcoin" class="flex w-full items-center space-x-2"
            ><LucideBitcoin class="mr-2 h-6 w-6" /> Bitcoin</Label
        >
        <RadioGroup.Item value="bitcoin" id="bitcoin" />
    </div>
    <div class="flex items-center justify-between rounded-lg border p-4">
        <Label for="credit-card" class="flex w-full items-center space-x-2"
            ><LucideCreditCard class="mr-2 h-6 w-6" /> Credit Card</Label
        >
        <RadioGroup.Item value="credit-card" id="credit-card" />
    </div>
    <div class="flex items-center justify-between rounded-lg border p-4">
        <Label for="option-three" class="flex w-full items-center space-x-2"
            ><LucideBanknote class="mr-2 h-6 w-6" /> Cash</Label
        >
        <RadioGroup.Item value="option-three" id="option-three" />
    </div>
</RadioGroup.Root>

<Confirm {address} />
