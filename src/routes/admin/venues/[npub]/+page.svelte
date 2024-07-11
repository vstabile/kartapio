<script lang="ts">
    import { page } from '$app/stores';
    import * as Breadcrumb from '$lib/components/ui/breadcrumb/index.js';
    import ndk from '$stores/ndk';
    import { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
    import { nip19 } from 'nostr-tools';
    import type { Venue } from '$stores/venues';
    import venues from '$stores/venues';
    import { bytesToHex } from '@noble/hashes/utils';
    import DeleteVenue from './DeleteVenue.svelte';
    import Button from '$components/ui/button/button.svelte';
    import LucideEye from '~icons/lucide/eye';
    import LucideQrCode from '~icons/lucide/qr-code';
    import QRCode from '$components/QRCode.svelte';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Toaster } from 'svelte-sonner';
    import Menu from './Menu.svelte';
    import Sortable from 'sortablejs';
    import { onDestroy, onMount } from 'svelte';
    import { Product } from '$stores/venues';
    import SearchBox from '$components/SearchBox.svelte';
    import { searchResults } from '$stores/search';
    import AddMenuButton from './AddMenuButton.svelte';

    const npub = $page.params.npub;
    const pubkey = nip19.decode(npub).data as string;

    let venue: Venue | undefined;
    let sk: Uint8Array;
    let hexkey: string;
    let allDishes: Product[] = [];

    const baseUrl = import.meta.env.VITE_BASE_URL;

    // Get venue's secret key for signing events
    $: {
        venue = $venues.find((item) => item.npub === npub);
        sk = new Uint8Array(venue?.sk ?? []);
        hexkey = bytesToHex(sk);
        if (venue) allDishes = venue.stalls.flatMap((stall) => stall.products);
    }

    let menuList: HTMLElement | undefined;
    let sortable: Sortable | undefined;

    onMount(() => {
        Sortable.create(menuList!, {
            animation: 400,
            handle: '.menu-handle',
            onEnd: async (event) => {
                const sortedIds = Array.from(menuList!.children).map((el) => el.id);
                const aTags = sortedIds.map((id) => ['a', `30017:${pubkey}:${id}`]);
                const sortingEvent = new NDKEvent($ndk, {
                    pubkey: pubkey,
                    content: '',
                    created_at: Math.floor(Date.now() / 1000),
                    kind: 30003,
                    tags: [...[['d', 'stalls']], ...aTags]
                });

                await sortingEvent.sign(new NDKPrivateKeySigner(hexkey));
                sortingEvent.publish();
            }
        });
    });

    onDestroy(() => {
        sortable?.destroy();
    });
</script>

<Breadcrumb.Root class="mb-4">
    <Breadcrumb.List>
        <Breadcrumb.Item>
            <Breadcrumb.Link href="/admin/venues">Venues</Breadcrumb.Link>
        </Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item>
            <Breadcrumb.Page>{venue?.name}</Breadcrumb.Page>
        </Breadcrumb.Item>
    </Breadcrumb.List>
</Breadcrumb.Root>

<div class="flex justify-between">
    <div class="block w-full justify-between sm:flex">
        <div class="flex w-full items-center justify-start">
            {#if venue && venue?.picture}
                <img src={venue?.picture} alt={venue?.name} class="mr-4 h-24" />
            {/if}
            <div class="block pb-4">
                <h1 class="text-3xl font-extrabold">{venue?.name}</h1>
                <p class="pt-2 text-gray-600">{venue?.about}</p>
            </div>
        </div>
        <div class="flex">
            <SearchBox dishes={allDishes} />
            <Button variant="outline" class="ml-2 h-9 w-12 p-0">
                <a href="/venues/{npub}" target="_blank"><LucideEye class="inline" /></a>
            </Button>
            <Dialog.Root closeOnOutsideClick={true}>
                <Dialog.Trigger asChild let:builder>
                    <Button builders={[builder]} variant="outline" class="ml-2 h-9 w-12 p-0">
                        <LucideQrCode class="inline" />
                    </Button>
                </Dialog.Trigger>
                <Dialog.Content class="w-auto md:w-auto">
                    <Dialog.Description class="h-64">
                        <QRCode url={`${baseUrl}/venues/${npub}`} />
                    </Dialog.Description>
                </Dialog.Content>
            </Dialog.Root>
        </div>
    </div>
</div>

<div
    class="grid grid-cols-1 gap-2 pb-4 pt-2 lg:grid-cols-2 2xl:grid-cols-3"
    bind:this={menuList}
    class:hidden={$searchResults?.length == 0}
>
    {#if venue}
        {#each venue?.stalls as menu (menu.id)}
            <Menu {menu} {venue} />
        {/each}
    {/if}
</div>

<div
    class="flex h-48 w-full items-center"
    class:hidden={!$searchResults || $searchResults.length > 0}
>
    <p class=" w-full text-center text-gray-600">No search results found</p>
</div>

<div class="flex w-full justify-between">
    {#if venue}
        <AddMenuButton {venue} />

        <DeleteVenue {venue} />
    {/if}
</div>

<Toaster />
