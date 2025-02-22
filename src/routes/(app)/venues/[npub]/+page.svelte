<script lang="ts">
    import { page } from '$app/stores';
    import { nip19 } from 'nostr-tools';
    import venues, { Venue } from '$stores/venues';
    import * as Card from '$lib/components/ui/card';
    import LucideImage from '~icons/lucide/image';
    import SearchBox from '$components/SearchBox.svelte';
    import { searchResults } from '$stores/search';
    import { Product } from '$stores/venues';
    import { dishFormSchema } from '../../../admin/venues/[npub]/schema';
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

<div
    style="background-color: rgba(255, 248, 235, 1);"
    class="bg-gray-50 sm:px-10 sm:pt-10"
>
    {#if venue}
        <div class="flex justify-between pb-4">
            <div class="flex w-full items-center justify-start">
                <div class="block w-full justify-between sm:flex">
                    <div class="relative w-screen">
                        <!-- Imagem preenchendo toda a tela -->
                        <img
                            class="full object-cover"
                            src="https://cdn.acritica.net/img/pc/920/600/dn_arquivo/2022/05/front-view-woman-eating-meat-burger.jpg"
                            alt="Cheeseburger Madero"
                        />

                        <!-- Span sobreposto no canto superior esquerdo -->
                        <span
                            class="absolute left-2 top-2 rounded-full bg-[#1A472A] px-4 py-2 text-[11px] font-bold text-white"
                        >
                            {venue?.name}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        <div class="m-5">
            <SearchBox dishes={allDishes} />
        </div>
        <div
            class="grid grid-cols-1 gap-2 pb-4 pt-2 lg:grid-cols-2 2xl:grid-cols-3"
            class:hidden={$searchResults?.length == 0}
        >
            {#each venue.stalls as menu (menu.id)}
                <div class="flex flex-col">
                    <Card.Header>
                        <Card.Title class="text-balck flex justify-between">
                            {menu.name}
                        </Card.Title>
                        <Card.Description class="text-black">
                            {menu.description}
                        </Card.Description>
                    </Card.Header>
                    <div class="flex h-full flex-col justify-between">
                        <Card.Content class="h-full px-1 py-0">
                            {#if menu.products?.length > 0}
                                {#each menu.products as dish (dish.id)}
                                    <div
                                        class="inline-inherit items-center justify-center"
                                        style="padding: 10px;"
                                        class:hidden={$searchResults &&
                                            !$searchResults.includes(dish.id)}
                                    >
                                        <div
                                            class="flex w-[347px] items-center gap-6 rounded-2xl p-6"
                                            style="background-color: rgb(0 0 0 / 6%)"
                                        >
                                            <!-- Imagem do Produto -->
{#if dish.images?.length > 0}
                                                <img
                                                    src={dish.images.at(0)}
                                                    alt={dish.name}
                                                    class="h-10 w-10 rounded-lg text-gray-400"
                                                />
                                            {:else}
                                                <LucideImage
                                                    class="h-20 w-20 rounded-lg object-cover"
                                                />
                                            {/if}

                                            <!-- Conteúdo do Produto -->
                                            <div class="flex flex-1 flex-col text-black">
                                                <h2 class="text-sm font-bold">{dish.name}</h2>
                                                <p class="text-balck" style="font-size: 11px;">
                                                    {dish.description}
                                                </p>
                                                <div class="mt-1 flex items-center justify-between">
                                                    <!-- Preço -->
                                                    <span
                                                        style="background-color: rgba(26, 71, 42, 0.15); color:rgba(26, 71, 42, 1);"
                                                        class="rounded-full px-4 py-2 text-[9px] font-bold text-white"
                                                        >{`${menu.currency} ${dish.price}`}</span
                                                    >
 <AddToCart product={dish} />
                                                    <!-- Contador -->
                                                    <div class="flex items-center space-x-4">
                                                        <button
                                                            style="background-color: rgba(26, 71, 42, 1);color: rgba(232, 213, 181, 1);"
                                                            class="flex h-8 w-8 items-center justify-center rounded-full text-xl text-white"
                                                            >−</button
                                                        >
                                                        <span class="text-lg">0</span>
                                                        <button
                                                            style="background-color: rgba(26, 71, 42, 1);color: rgba(232, 213, 181, 1);"
                                                            class="flex h-8 w-8 items-center justify-center rounded-full text-xl text-white"
                                                            >+</button
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                {/each}
                            {/if}
                        </Card.Content>
                    </div>
                    <Card.Footer class="block"></Card.Footer>
                </div>
            {/each}
        </div>
    {/if}

    <div
        class="flex h-48 w-full items-center"
        class:hidden={!$searchResults || $searchResults.length > 0}
    >
        <p class=" w-full text-center text-gray-600">No search results found</p>
    </div>
</div>

{#if $cart.length > 0}
    <CartFooter />
{/if}