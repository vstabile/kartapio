import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { NDKEvent, profileFromEvent } from '@nostr-dev-kit/ndk';
import { getPublicKey, nip19 } from 'nostr-tools';
import * as nip44 from 'nostr-tools/nip44';
import { writable, get } from 'svelte/store';
import ndk from '$stores/ndk';
import type { NDKSubscription } from '@nostr-dev-kit/ndk';

const $ndk = get(ndk);

interface VenueJSON {
    pubkey: string;
    sk: string;
    name: string;
    about: string;
    picture: string;
    sorting: Sorting;
    updated_at: number;
}

export class Venue {
    pubkey: string;
    sk?: Uint8Array;
    name?: string;
    about?: string;
    picture?: string;
    stalls: Stall[];
    sorting?: Sorting;
    updated_at?: number;

    private _npub: string | undefined;
    private _hexkey: string | undefined;

    constructor(sk?: Uint8Array | string, pubkey?: string) {
        if (sk) {
            this.sk = typeof sk === 'string' ? hexToBytes(sk) : sk;
            this.pubkey = getPublicKey(this.sk);
        } else if (pubkey) {
            this.pubkey = pubkey;
        } else {
            throw new Error('Either sk or pubkey must be provided');
        }
        this.stalls = [];
    }

    get npub() {
        this._npub ??= nip19.npubEncode(this.pubkey);
        return this._npub;
    }

    get hexkey() {
        if (this.sk) {
            this._hexkey ??= bytesToHex(this.sk);
            return this._hexkey;
        } else {
            return undefined;
        }
    }

    toJSON() {
        return {
            pubkey: this.pubkey,
            sk: this.hexkey,
            name: this.name,
            about: this.about,
            picture: this.picture,
            sorting: this.sorting,
            updated_at: this.updated_at
        };
    }

    fromJSON(json: VenueJSON) {
        const venue = new Venue(json.pubkey);
        venue.sk = hexToBytes(json.sk);
        this.name = json.name;
        this.about = json.about;
        this.picture = json.picture;
        this.sorting = json.sorting;
        this.updated_at = json.updated_at;
        return venue;
    }
}

export class Stall {
    pubkey: string;
    id: string;
    name?: string;
    description?: string;
    currency?: string;
    draft: boolean;
    products: Product[];
    sorting?: Sorting;
    updated_at: number;

    constructor(event: NDKEvent, products: Product[] = [], draft = false) {
        const content = JSON.parse(event.content);
        this.pubkey = event.pubkey;
        this.id = content.id;
        this.name = content.name;
        this.description = content.description;
        this.currency = content.currency;
        this.draft = draft;
        this.products = products;
        this.updated_at = event.created_at!;
    }

    get a() {
        return `30017:${this.pubkey}:${this.id}`;
    }

    toEvent(
        opts: {
            id?: string;
            name?: string;
            description?: string;
            currency?: string;
            created_at?: number;
            draft?: boolean;
            sk?: Uint8Array;
        } = {}
    ) {
        const draft = opts.draft != undefined ? opts.draft : this.draft;

        if (draft && !opts.sk) throw new Error('sk is required for draft events');

        const content = {
            id: opts.id ? opts.id : this.id,
            name: opts.name ? opts.name : this.name,
            description: opts.description ? opts.description : this.description,
            currency: opts.currency ? opts.currency : this.currency
        };

        const event = new NDKEvent($ndk, {
            pubkey: this.pubkey,
            content: JSON.stringify(content),
            kind: 30017,
            created_at: opts.created_at ? opts.created_at : this.updated_at,
            tags: [['d', content.id]]
        });

        if (draft) {
            const plainPayload = JSON.stringify(event.rawEvent());
            const conversationKey = nip44.getConversationKey(opts.sk!, this.pubkey);
            const encryptedPayload = nip44.encrypt(plainPayload, conversationKey);

            return new NDKEvent($ndk, {
                pubkey: this.pubkey,
                content: encryptedPayload,
                kind: 31234,
                created_at: opts.created_at ? opts.created_at : this.updated_at,
                tags: [
                    ['d', content.id],
                    ['k', '30017']
                ]
            });
        }

        return event;
    }
}

export class Product {
    pubkey: string;
    id: string;
    stall_id: string;
    name: string;
    description: string;
    images: string[];
    price: number;
    currency: string;
    updated_at: number;

    constructor(event: NDKEvent) {
        this.pubkey = event.pubkey;
        const content = JSON.parse(event.content);
        this.id = content.id;
        this.stall_id = content.stall_id;
        this.name = content.name;
        this.description = content.description;
        this.images = content.images;
        this.price = content.price;
        this.currency = content.currency;
        this.updated_at = event.created_at!;
    }

    toEvent(
        opts: {
            id?: string;
            stall_id?: string;
            name?: string;
            description?: string;
            price?: number;
            images?: string[];
            created_at?: number;
        } = {}
    ) {
        const content = {
            id: opts.id ? opts.id : this.id,
            stall_id: opts.stall_id ? opts.stall_id : this.stall_id,
            name: opts.name ? opts.name : this.name,
            description: opts.description ? opts.description : this.description,
            images: opts.images ? opts.images : this.images,
            price: opts.price ? opts.price : this.price,
            currency: this.currency
        };

        return new NDKEvent($ndk, {
            pubkey: this.pubkey,
            content: JSON.stringify(content),
            kind: 30018,
            created_at: opts.created_at ? opts.created_at : this.updated_at,
            tags: [['d', content.id]]
        });
    }
}

class Sorting {
    ids: string[];
    updated_at: number;

    constructor(event: NDKEvent) {
        this.updated_at = event.created_at!;
        this.ids = event.tags.filter((tag) => tag[0] === 'a').map((tag) => tag[1].split(':')[2]);
    }
}

function createStore() {
    const { subscribe, update } = writable<Venue[]>([]);

    let subscription: NDKSubscription;
    let deletionSubscription: NDKSubscription;
    let tagIds: string[] = [];
    let deletedIds: { [key: string]: number } = {};
    let waitingDeletionSubscription = false;
    let orphanProducts: { [key: string]: Product[] } = {};

    function wasDeleted(event: NDKEvent) {
        const d = event.dTag;
        return (
            d != undefined &&
            Object.keys(deletedIds).includes(d) &&
            deletedIds[d] >= event.created_at!
        );
    }

    function processVenue(event: NDKEvent) {
        const npub = nip19.npubEncode(event.pubkey);
        update((venues) => {
            const venue = venues.find((v) => v.npub === npub);

            if (!venue?.updated_at || event.created_at! > venue.updated_at) {
                const profile = profileFromEvent(event);

                return venues.map((v) => {
                    if (v.npub != npub) return v;
                    v.name = profile.name;
                    v.about = profile.about;
                    v.picture = profile.image;
                    v.updated_at = event.created_at;
                    return v;
                });
            }

            return venues;
        });
    }

    async function processStallDraft(_event: NDKEvent) {
        let event = _event;
        update((venues) => {
            const venue = venues.find((v) => v.pubkey === event.pubkey);
            if (!venue) return venues;
            if (!venue.sk) return venues;

            let decryptedPayload;
            try {
                const conversationKey = nip44.getConversationKey(venue.sk, venue.pubkey);
                decryptedPayload = nip44.decrypt(event.content, conversationKey);
            } catch (e) {
                return venues;
            }

            let jsonEvent;
            try {
                jsonEvent = JSON.parse(decryptedPayload);
            } catch (e) {
                return venues;
            }

            event = new NDKEvent($ndk, jsonEvent);

            const existingStall = venue.stalls.find((s) => s.id === event.dTag);
            if (existingStall && event.created_at! > existingStall.updated_at) {
                venue.stalls = venue.stalls.map((s) =>
                    s.id === event.dTag ? new Stall(event, existingStall.products, true) : s
                );
            } else if (!existingStall && !wasDeleted(event)) {
                const stall = new Stall(event, orphanProducts[event.dTag!], true);
                orphanProducts[event.dTag!] = [];
                if (venue.sorting && venue.sorting.ids.includes(stall.id)) {
                    const index = venue.sorting.ids.indexOf(stall.id);
                    venue.stalls = [
                        ...venue.stalls.slice(0, index),
                        stall,
                        ...venue.stalls.slice(index)
                    ];
                } else {
                    venue.stalls = [...venue.stalls, stall];
                }
                updateDeletionFilter(_event);
            }

            return venues;
        });
    }

    function processStall(event: NDKEvent) {
        update((venues) => {
            const venue = venues.find((v) => v.pubkey === event.pubkey);
            if (!venue) return venues;

            const existingStall = venue.stalls.find((s) => s.id === event.dTag);
            if (existingStall && event.created_at! > existingStall.updated_at) {
                venue.stalls = venue.stalls.map((s) =>
                    s.id === event.dTag ? new Stall(event, existingStall.products) : s
                );
                if (existingStall.draft) updateDeletionFilter(event);
            } else if (!existingStall && !wasDeleted(event)) {
                const stall = new Stall(event, orphanProducts[event.dTag!]);
                orphanProducts[event.dTag!] = [];
                if (venue.sorting && venue.sorting.ids.includes(stall.id)) {
                    const index = venue.sorting.ids.indexOf(stall.id);
                    venue.stalls = [
                        ...venue.stalls.slice(0, index),
                        stall,
                        ...venue.stalls.slice(index)
                    ];
                } else {
                    venue.stalls = [...venue.stalls, stall];
                }
                updateDeletionFilter(event);
            }

            return venues;
        });
    }

    function processProduct(event: NDKEvent) {
        update((venues) => {
            const venue = venues.find((v) => v.pubkey === event.pubkey);
            if (!venue) return venues;

            const content = JSON.parse(event.content);
            const stall_id: string = content.stall_id;
            const stall = venue.stalls.find((s) => s.id === stall_id);
            if (!stall) {
                const product = new Product(event);
                if (orphanProducts[stall_id]) {
                    orphanProducts[stall_id].push(product);
                } else {
                    orphanProducts[stall_id] = [product];
                }
                return venues;
            }

            const existingProduct = stall.products.find((p) => p.id === event.dTag);
            if (existingProduct && event.created_at! > existingProduct.updated_at) {
                stall.products = stall.products.map((p) =>
                    p.id === event.dTag ? new Product(event) : p
                );
            } else if (!existingProduct && !wasDeleted(event)) {
                const product = new Product(event);
                if (stall.sorting && stall.sorting.ids.includes(product.id)) {
                    const index = stall.sorting.ids.indexOf(product.id);
                    stall.products = [
                        ...stall.products.slice(0, index),
                        product,
                        ...stall.products.slice(index)
                    ];
                } else {
                    stall.products = [...stall.products, product];
                }
                updateDeletionFilter(event);
            }

            return venues;
        });
    }

    function processDeletion(event: NDKEvent) {
        update((venues) => {
            const venue = venues.find((v) => v.pubkey === event.pubkey);
            if (!venue) return venues;

            const tagIds = event.tags.filter((tag) => tag[0] === 'a').map((tag) => tag[1]);
            for (const tagId of tagIds) {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const [kind, _, d] = tagId.split(':');
                if (Object.keys(deletedIds).includes(d) && deletedIds[d] >= event.created_at!)
                    continue;
                deletedIds = { ...deletedIds, [d]: event.created_at! };
                if (kind === '30017' || kind === '31234') {
                    const stall = venue.stalls.find((s) => s.id === d);
                    if (stall) orphanProducts[d] = stall.products;
                    venue.stalls = venue.stalls.filter(
                        (s) => s.id !== d || s.updated_at > event.created_at!
                    );
                } else if (kind === '30018') {
                    for (const stall of venue.stalls) {
                        stall.products = stall.products.filter(
                            (p) => p.id !== d || p.updated_at > event.created_at!
                        );
                    }
                }
            }

            return venues;
        });
    }

    function processSorting(event: NDKEvent) {
        if (event.dTag === 'stalls') {
            update((venues) => {
                const venue = venues.find((v) => v.pubkey === event.pubkey);
                if (!venue || (venue.sorting && venue.sorting.updated_at > event.created_at!))
                    return venues;

                venue.sorting = new Sorting(event);

                const sortedStalls = venue.sorting.ids
                    .map((id) => venue.stalls.find((s) => s.id === id))
                    .filter((s) => s !== undefined);

                const unsortedStalls = venue.stalls.filter(
                    (s) => !venue.sorting!.ids.includes(s.id)
                );

                venue.stalls = [...sortedStalls, ...unsortedStalls];

                return venues;
            });
        } else if (event.dTag?.split(':')[0] === '30017') {
            update((venues) => {
                const venue = venues.find((v) => v.pubkey === event.pubkey);
                if (!venue) return venues;

                const stall = venue.stalls.find((s) => s.id === event.dTag?.split(':')[2]);
                if (!stall || (stall.sorting && stall.sorting.updated_at > event.created_at!))
                    return venues;

                const sorting = new Sorting(event);
                // Ignore event if there are duplicate ids
                if (new Set(sorting.ids).size !== sorting.ids.length) return venues;

                stall.sorting = sorting;

                const sortedProducts = stall.sorting.ids
                    .map((id) => stall.products.find((p) => p.id === id))
                    .filter((p) => p !== undefined);

                const unsortedProducts = stall.products.filter(
                    (p) => !stall.sorting!.ids.includes(p.id)
                );

                stall.products = [...sortedProducts, ...unsortedProducts];

                return venues;
            });
        }
    }

    function processEvent(event: NDKEvent) {
        if (event.kind === 0) {
            processVenue(event);
        } else if (event.kind === 31234 && event.tagValue('k') === '30017') {
            processStallDraft(event);
        } else if (event.kind === 30017) {
            processStall(event);
        } else if (event.kind === 30018) {
            processProduct(event);
        } else if (event.kind === 30003) {
            processSorting(event);
        }
    }

    function updateDeletionFilter(event: NDKEvent) {
        tagIds = [...tagIds, event.tagId()];

        if (waitingDeletionSubscription) return;

        waitingDeletionSubscription = true;
        setTimeout(() => {
            waitingDeletionSubscription = false;
            updateDeletionSubscription();
        }, 200);
    }

    function updateDeletionSubscription() {
        const pubkeys = subscription.filters[0].authors;
        const filter = { kinds: [5], authors: pubkeys, '#a': tagIds };

        if (deletionSubscription) deletionSubscription.stop();
        deletionSubscription = $ndk.subscribe(filter);
        deletionSubscription.on('event', processDeletion);
    }

    return {
        subscribe,
        clear: () => {
            if (subscription) subscription.stop();
            if (deletionSubscription) deletionSubscription.stop();
            tagIds = [];
            deletedIds = {};
            waitingDeletionSubscription = false;
            orphanProducts = {};
            update(() => []);
        },
        setKeys: (hexkeys: string[]) => {
            if (subscription) subscription.stop();

            update((venues) => {
                // Update removed venues
                venues = venues.filter((venue) => hexkeys.includes(venue.hexkey!));
                // Update added venues
                const addedVenues = hexkeys
                    .filter((hexkey) => !venues.some((venue) => venue.hexkey === hexkey))
                    .map((hexkey) => new Venue(hexkey));
                venues = [...venues, ...addedVenues];
                // Update subscription
                const pubkeys = venues.map((venue) => venue.pubkey);
                subscription = $ndk.subscribe([
                    {
                        authors: pubkeys,
                        kinds: [0, 30017, 30018, 30003]
                    },
                    { authors: pubkeys, kinds: [31234 as number], '#k': ['30017'] }
                ]);
                return venues;
            });

            subscription.on('event', processEvent);
        },
        setPubkeys: (pubkeys: string[]) => {
            if (subscription) subscription.stop();

            update((venues) => {
                // Update removed venues
                venues = venues.filter((venue) => pubkeys.includes(venue.pubkey!));
                // Update added venues
                const addedVenues = pubkeys
                    .filter((pubkey) => !venues.some((venue) => venue.pubkey === pubkey))
                    .map((pubkey) => new Venue(undefined, pubkey));
                venues = [...venues, ...addedVenues];
                // Update subscription
                subscription = $ndk.subscribe([
                    {
                        authors: pubkeys,
                        kinds: [0, 30017, 30018, 30003]
                    },
                    { authors: pubkeys, kinds: [31234 as number], '#k': ['30017'] }
                ]);
                return venues;
            });

            subscription.on('event', processEvent);
        }
    };
}

const venues = createStore();

export default venues;
