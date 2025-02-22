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

<div style="background-color: rgba(255, 248, 235, 1);" class="bg-gray-50 sm:px-10 sm:pt-10">
    {#if venue}
        <!-- Cabeçalho com imagem e nome do venue -->
        <div class="flex flex-col pb-4">
            <div class="relative w-full">
                <!-- Imagem preenchendo toda a largura -->
                {#if venue.picture}
                    <img
                        class="h-48 w-full object-cover sm:h-64 md:h-80"
                        src={venue.picture}
                        alt="Venue"
                    />
                {:else}
                    <img
                        class="h-48 w-full object-cover sm:h-64 md:h-80"
                        src="https://cdn.acritica.net/img/pc/920/600/dn_arquivo/2022/05/front-view-woman-eating-meat-burger.jpg"
                        alt="Cheeseburger"
                    />
                {/if}
                <!-- Span sobreposto no canto superior esquerdo -->
                <span
                    class="absolute left-2 top-2 rounded-full bg-[#1A472A] px-3 py-1 text-[11px] font-bold text-white text-2xl"
                >
                    {venue?.name}
                </span>
            </div>
        </div>

        <!-- Caixa de pesquisa -->
        <div class="m-5">
            <SearchBox dishes={allDishes} />
        </div>

        <!-- Lista de menus com grid responsivo -->
        <div
            class="grid grid-cols-1 gap-2 pb-4 pt-2 lg:grid-cols-2 2xl:grid-cols-3"
            class:hidden={$searchResults?.length == 0}
        >
            {#each venue.stalls as menu (menu.id)}
                <div class="flex flex-col">
                    <Card.Header>
                        <Card.Title class="flex justify-between text-black">
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
                                        class="inline-flex w-full items-center justify-center p-2"
                                        class:hidden={$searchResults &&
                                            !$searchResults.includes(dish.id)}
                                    >
                                        <div
                                            class="flex w-full items-center gap-4 rounded-2xl p-4 sm:max-w-sm md:max-w-md lg:max-w-lg"
                                            style="background-color: rgb(0 0 0 / 6%)"
                                        >
                                            <!-- Imagem do Produto -->
                                            {#if dish.images?.length > 0}
                                                <img
                                                    src={dish.images.at(0)}
                                                    alt={dish.name}
                                                    class="h-10 w-10 rounded-lg object-cover text-gray-400"
                                                />
                                            {:else}
                                                <LucideImage
                                                    class="h-10 w-10 rounded-lg object-cover"
                                                />
                                            {/if}

                                            <!-- Conteúdo do Produto -->
                                            <div class="flex flex-1 flex-col text-black">
                                                <h2 class="text-sm font-bold">{dish.name}</h2>
                                                <p class="truncate text-[11px] text-black">
                                                    {dish.description}
                                                </p>
                                                <div class="mt-1 flex items-center justify-between">
                                                    <!-- Preço -->
                                                    <span
                                                        style="background-color: rgba(26, 71, 42, 0.15); color: rgba(26, 71, 42, 1);"
                                                        class="rounded-full px-3 py-1 text-[9px] font-bold"
                                                    >
                                                        {`${menu.currency} ${dish.price}`}
                                                    </span>
                                                    <AddToCart product={dish} />
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

    <!-- Mensagem para sem resultados de pesquisa -->
    <div
        class="flex h-48 w-full items-center"
        class:hidden={!$searchResults || $searchResults.length > 0}
    >
        <p class="w-full text-center text-gray-600">No search results found</p>
    </div>
</div>
<br /><br /><br />

{#if $cart.length > 0}
    <CartFooter />
{/if}
