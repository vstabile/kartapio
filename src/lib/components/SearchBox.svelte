<script lang="ts">
    import Input from '$components/ui/input/input.svelte';
    import debounce from 'lodash.debounce';
    import { createDishesIndex, searchDishesIndex } from '$stores/search';
    import { Product } from '$stores/venues';
    import { searchResults } from '$stores/search';
    import LucideSearch from '~icons/lucide/search';

    export let dishes: Product[];
    let searchQuery: string;

    $: if (dishes) createDishesIndex(dishes);
    $: if (searchQuery != undefined) handleSearch(searchQuery);

    const handleSearch = debounce((query: string) => {
        if (query === '') searchResults.set(undefined);
        else searchResults.set(searchDishesIndex(query) as string[]);
    }, 300);
</script>

<div class="items-top relative flex w-full">
    <LucideSearch class="absolute left-2 top-2 text-gray-400" />
    <Input
        type="text"
        placeholder="Search"
        class="h-9 w-full pl-8 focus-visible:ring-1 focus-visible:ring-offset-0 sm:focus-visible:ring-offset-2"
        bind:value={searchQuery}
        autocomplete="off"
        spellcheck="false"
    />
</div>
