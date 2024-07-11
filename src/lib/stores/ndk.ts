import NDK from '@nostr-dev-kit/ndk';
import { writable } from 'svelte/store';

const relays = import.meta.env.VITE_RELAYS.split(',');

const _ndk = new NDK({
    explicitRelayUrls: relays
    // outboxRelayUrls: [
    //     'wss://purplepag.es'
    // ],
    // enableOutboxModel: true,
});

const ndk = writable(_ndk);

export default ndk;
