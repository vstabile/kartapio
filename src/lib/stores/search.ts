import FlexSearch from 'flexsearch';
import { writable } from 'svelte/store';
import { Product } from '$stores/venues';

let dishesIndex: FlexSearch.Index;

export const searchResults = writable<string[] | undefined>(undefined);

export function createDishesIndex(data: Product[]) {
    dishesIndex = new FlexSearch.Index({ tokenize: 'forward' });

    data.forEach((dish) => {
        dishesIndex.add(dish.id, dish.name);
    });
}

export function searchDishesIndex(query: string) {
    const match = query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const results = dishesIndex.search(match);

    return results;
}
