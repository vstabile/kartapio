<script lang="ts">
    import { page } from '$app/stores';
    import { nip19 } from 'nostr-tools';
    import venues, { Venue } from '$stores/venues';
    import * as Card from '$lib/components/ui/card';
    import LucideImage from '~icons/lucide/image';
    import SearchBox from '$components/SearchBox.svelte';
    import { searchResults } from '$stores/search';
    import { Product } from '$stores/venues';
    import AddToCart from './AddToCart.svelte';
    import CartFooter from './CartFooter.svelte';
    import { cart } from '$stores/cart';

    const npub = $page.params.npub;

    const pubkey = nip19.decode(npub).data as string;
    let venue: Venue | undefined;
    let allDishes: Product[] = [];

    venues.setPubkeys([pubkey]);
    $: venue = $venues.find((item) => item.pubkey === pubkey);
    $: if (venue) allDishes = venue.stalls.flatMap((stall) => stall.products);
</script>

{#if venue}
    <div class="flex justify-between">
        <div class="flex w-full items-center justify-start">
            {#if venue && venue?.picture != '' && venue?.picture != null}
                <img src={venue?.picture} alt={venue?.name} class="mr-4 h-24" />
            {/if}
            <div class="block w-full justify-between sm:flex">
                <div class="block pb-6">
                    <h1 class="text-4xl font-extrabold">{venue?.name}</h1>
                    <p class="pt-2 text-gray-600">{venue?.about}</p>
                </div>
                <div class="flex">
                    <SearchBox dishes={allDishes} />
                </div>
            </div>
        </div>
    </div>

    <div
        class="grid grid-cols-1 gap-2 pb-4 pt-2 lg:grid-cols-2 2xl:grid-cols-3"
        class:hidden={$searchResults?.length == 0}
    >
        {#each venue.stalls as menu (menu.id)}
            <Card.Root class="flex flex-col">
                <Card.Header>
                    <Card.Title class="flex justify-between">
                        {menu.name}
                    </Card.Title>
                    <Card.Description>
                        {menu.description}
                    </Card.Description>
                </Card.Header>
                <div class="flex h-full flex-col justify-between">
                    <Card.Content class="h-full px-6 py-0">
                        {#if menu.products?.length > 0}
                            {#each menu.products as dish (dish.id)}
                                <div
                                    class="flex items-center justify-between"
                                    class:hidden={$searchResults &&
                                        !$searchResults.includes(dish.id)}
                                >
                                    <div class="flex items-center">
                                        <div>
                                            {#if dish.images?.length > 0}
                                                <img
                                                    src={dish.images.at(0)}
                                                    alt={dish.name}
                                                    class="h-16 w-16 rounded-lg"
                                                />
                                            {:else}
                                                <LucideImage
                                                    class="h-10 w-10 rounded-lg text-gray-400"
                                                />
                                            {/if}
                                        </div>
                                        <div class="ml-3">
                                            <p class="text-sm font-medium leading-none">
                                                {dish.name}
                                            </p>
                                            <p class="text-sm text-muted-foreground">
                                                {dish.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex justify-end">
                                        <div class="min-w-max">
                                            {`${dish.price} ${menu.currency}`}
                                        </div>
                                        <AddToCart productId={dish.id} />
                                    </div>
                                </div>
                            {/each}
                        {/if}
                    </Card.Content>
                </div>
                <Card.Footer class="block"></Card.Footer>
            </Card.Root>
        {/each}
    </div>
{/if}

<div
    class="flex h-48 w-full items-center"
    class:hidden={!$searchResults || $searchResults.length > 0}
>
    <p class=" w-full text-center text-gray-600">No search results found</p>
</div>

{#if $cart.length > 0}
    <CartFooter />
{/if}
