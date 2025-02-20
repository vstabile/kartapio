import { persist, createLocalStorage } from '@macfja/svelte-persistent-store';
import NDKSvelte, {
    NDKEvent,
    NDKList,
    NDKKind,
    profileFromEvent,
    type NDKFilter,
    NDKNip46Signer
} from '@nostr-dev-kit/ndk';
import { NDKUser } from '@nostr-dev-kit/ndk';
import { get, type Writable } from 'svelte/store';
import { writable } from 'svelte/store';
import { persisted } from 'svelte-persisted-store';
import { SK_LIST_KIND } from '$lib/constants';
import ndk from '$stores/ndk';
import venueProfiles from '$stores/venues';
import type { UserProfile } from '$lib/types';

let $ndk = get(ndk);

export type SignInMethod = 'none' | 'pk' | 'nip07' | 'nip46';

export type Session = {
    signInMethod: SignInMethod;
    user: NDKUser | undefined;
    privateKey: string | undefined;
    remotePubkey: string | undefined;
};

const emptySession: Session = {
    signInMethod: 'none',
    user: undefined,
    privateKey: undefined,
    remotePubkey: undefined
};

function createSessionStore() {
    const { subscribe, set, update } = persisted<Session>('session', emptySession);

    return {
        subscribe,
        setPrivateKey: (privateKey: string) => {
            set({ ...get(session), privateKey });
        },
        setUser: (user: NDKUser, signInMethod: SignInMethod, privateKey?: string) => {
            update((session) => {
                if (signInMethod === 'nip46') {
                    if (!privateKey) throw new Error('Private key is required for NIP46 sign in');
                    session = { ...session, remotePubkey: user.pubkey, privateKey };
                }

                return { ...session, user, signInMethod };
            });
        },
        clear: () => set(emptySession)
    };
}

const session = createSessionStore();

export default session;

export const userProfile = persist(
    writable<UserProfile | undefined>(undefined),
    createLocalStorage(),
    'user-profile'
);

/**
 * Current user's lists
 */
export const skList = writable<NDKList | undefined>(undefined);

/**
 * Main entry point to prepare the session.
 */
export async function prepareSession(): Promise<void> {
    const $session = get(session);
    $ndk = $session.user?.ndk || $ndk;

    if (!$ndk || !$session.user) {
        return;
    }

    // Fetch user profile and the list of venues' secret keys
    await fetchData('user', $ndk, [$session.user.pubkey], {
        profileStore: userProfile,
        skStore: skList,
        listsKinds: [SK_LIST_KIND]
    });
}

interface IFetchDataOptions {
    profileStore?: Writable<UserProfile | undefined>;
    skStore?: Writable<NDKList | undefined>;
    closeOnEose?: boolean;
    waitUntilEoseToResolve?: boolean;
    listsKinds?: number[];
    extraKinds?: number[];
}

/**
 * Fetches the information regarding the current user
 */
async function fetchData(
    name: string,
    $ndk: NDKSvelte,
    authors: string[],
    opts: IFetchDataOptions
): Promise<void> {
    const $session = get(session);
    // set defaults
    opts.waitUntilEoseToResolve ??= true;
    opts.closeOnEose ??= false;

    const mostRecentEvents: Map<string, NDKEvent> = new Map();

    const processEvent = async (event: NDKEvent) => {
        const dedupKey = event.deduplicationKey();
        const existingEvent = mostRecentEvents.get(dedupKey);

        if (existingEvent && event.created_at! < existingEvent.created_at!) {
            return;
        }

        mostRecentEvents.set(dedupKey, event);

        if (event.kind === 0 && opts.profileStore) {
            processUserProfile(event);
        } else if (event.kind === SK_LIST_KIND) {
            processSkList(event);
        }
    };

    function processUserProfile(event: NDKEvent) {
        const $store = get(opts.profileStore!);

        if (event.created_at && (!$store?.created_at || event.created_at > $store.created_at)) {
            const profile = profileFromEvent(event) as UserProfile;
            profile.created_at = event.created_at;
            opts.profileStore!.set(profile);
        }
    }

    async function processSkList(event: NDKEvent) {
        if (!$session.user || !$session.user.ndk) return;
        const signer = $session.user.ndk.signer;
        const $store = get(opts.skStore!);

        if (event.created_at && (!$store?.created_at || event.created_at > $store.created_at)) {
            const newList = NDKList.from(event);
            newList.created_at = event.created_at;

            let popup: Window | null = null;
            if (signer instanceof NDKNip46Signer) {
                signer!.rpc.on('authUrl', (url: string) => {
                    popup = window.open(url, '_blank', 'width=300,height=350');

                    const checkPopup = setInterval(() => {
                        if (!popup || popup?.closed) {
                            clearInterval(checkPopup);
                        }
                    }, 500);
                });
            }

            const content = (await $ndk?.signer?.decrypt($session.user, newList.content)) || '';
            // @ts-ignore
            popup?.close();
            newList.tags = JSON.parse(content);
            opts.skStore!.set(newList);
            const sks = newList.tags.map((tag) => tag[1]);
            venueProfiles.setKeys(sks);
        }
    }

    return new Promise((resolve) => {
        const kinds = opts.extraKinds ?? [];

        if (opts.profileStore) {
            kinds.push(NDKKind.Metadata);
        }

        const filters: NDKFilter[] = [];

        if (kinds.length > 0) {
            filters.push({ kinds, authors, limit: 50 });
        }

        if (opts.skStore) kinds.push(SK_LIST_KIND as number);

        const userDataSubscription = $ndk.subscribe(filters, {
            closeOnEose: opts.closeOnEose!,
            groupable: false,
            // cacheUsage: NDKSubscriptionCacheUsage.PARALLEL,
            subId: `session:${name}`
        });

        userDataSubscription.on('event', processEvent);

        userDataSubscription.on('eose', () => {
            if (opts.waitUntilEoseToResolve) {
                resolve();
            }
        });

        if (!opts.waitUntilEoseToResolve) {
            resolve();
        }
    });
}
