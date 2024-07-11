import { get } from 'svelte/store';
import { persisted } from 'svelte-local-storage-store';
import { SK_LIST_KIND } from '$lib/constants';
import ndk from '$stores/ndk';
import type { NDKSubscription } from '@nostr-dev-kit/ndk';

const $ndk = get(ndk);

type Venue = {
    pubkey: string;
    sk?: Uint8Array;
    name?: string;
    about?: string;
    image?: string;
    stalls: Stall[];
    updatedAt?: number;
};

type Stall = {
    id: string;
    name?: string;
    description?: string;
    currency?: string;
    draft: boolean;
    products: Product[];
    updatedAt: number;
};

type Product = {
    id: string;
    stallId: string;
    name: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    updatedAt: number;
};

type State = {
    adminPubkey?: string;
    venues: Venue[];
};

function createStore() {
    const { subscribe, update } = persisted<State>('state', { venues: [] });

    // Initialize subscription to Nostr events based on
    // the persisted state
    let ndkSubscription: NDKSubscription;
    const unsubscribe = subscribe((state) => {
        updateSubscription(state);
    });
    unsubscribe();

    function updateSubscription(state: State) {
        const venuesPubkeys = state.venues.map((venue) => venue.pubkey);
        const stallTags = state.venues.flatMap((venue) => {
            return venue.stalls.map((stall) => `30017:${venue.pubkey}:${stall.id}`);
        });

        // TODO: Only fetch events that have occurred since the last update
        const filters = [
            // Filter venue profiles, stalls and products
            {
                authors: venuesPubkeys,
                kinds: [0, 30017, 30018]
            },
            // Filter stall and product lists for sorting
            { authors: venuesPubkeys, kinds: [30003], '#d': [...stallTags, 'stalls'] },
            // Filter to stall drafts
            { authors: venuesPubkeys, kinds: [31234 as number], '#k': ['30017'] }
        ];

        // Filter admin's list of venues
        if (state.adminPubkey) {
            filters.push({
                authors: [state.adminPubkey],
                kinds: [SK_LIST_KIND as number]
            });
        }

        ndkSubscription.stop();
        ndkSubscription = $ndk.subscribe(filters);
        ndkSubscription.on('event', processNostrEvent);
    }

    function processNostrEvent(event: Event) {
        console.log(event);
    }

    return {
        subscribe,
        setAdmin: (pubkey: string) => {
            update((state) => {
                state.adminPubkey = pubkey;
                updateSubscription(state);
                return state;
            });
        },
        addVenue: (pubkey: string) => {
            update((state) => {
                state.venues = [...state.venues, { pubkey, stalls: [] }];
                updateSubscription(state);
                return state;
            });
        }
    };
}

export const state = createStore();
