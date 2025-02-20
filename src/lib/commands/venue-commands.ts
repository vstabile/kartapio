import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { NDKEvent, NDKNip46Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { generateSecretKey, getPublicKey, nip04 } from 'nostr-tools';
import { get } from 'svelte/store';
import { SK_LIST_KIND } from '$lib/constants';
import ndk from '$stores/ndk';
import session from '$stores/session';
import { venueSchema, skListSchema, type Venue, type SkList } from './schemas';

export default class VenueCommands {
    static async add(venue: Venue, skList: SkList) {
        const $ndk = get(ndk);
        const $session = get(session);

        const venueValidation = venueSchema.safeParse(venue);
        const skListValidation = skListSchema.safeParse(skList);

        if (!venueValidation.success || !skListValidation.success) {
            const errors = [
                ...(venueValidation?.error?.errors ?? []),
                ...(skListValidation?.error?.errors ?? [])
            ];
            throw new Error(errors.map((err) => err.message).join(', '));
        }

        // Generate new venue keypair
        const sk = generateSecretKey();
        const pk = getPublicKey(sk);
        const hexkey = bytesToHex(sk);

        const metadataEvent = new NDKEvent($ndk, {
            pubkey: pk,
            // pubkey: $session.user!.pubkey,
            content: JSON.stringify(venue),
            created_at: Math.floor(Date.now() / 1000),
            kind: 0,
            tags: []
        });

        console.log('encrypting skList');
        let popup: Window | null = null;
        if ($ndk.signer instanceof NDKNip46Signer) {
            $ndk.signer!.rpc.on('authUrl', (url: string) => {
                popup = window.open(url, '_blank', 'width=300,height=350');

                const checkPopup = setInterval(() => {
                    if (!popup || popup?.closed) {
                        clearInterval(checkPopup);
                    }
                }, 500);
            });
        }
        console.log('data', [...skList, ['sk', hexkey]]);
        const encryptedList = await $ndk.signer!.encrypt(
            $session.user!,
            JSON.stringify([...skList, ['sk', hexkey]])
        );
        // @ts-ignore
        popup?.close();
        console.log('encrypted skList', encryptedList);

        console.log('creating skListEvent');
        const skListEvent = new NDKEvent($ndk, {
            pubkey: $session.user!.pubkey,
            content: encryptedList,
            created_at: Math.floor(Date.now() / 1000),
            kind: SK_LIST_KIND,
            tags: []
        });

        // console.log('encrypting skListEvent');
        // await skListEvent.encrypt($session.user, $ndk!.signer);
        console.log('signing metadataEvent');
        await metadataEvent.sign(new NDKPrivateKeySigner(hexkey));
        await skListEvent.sign($ndk.signer);
        console.log('publishing metadataEvent');
        await metadataEvent.publish();
        console.log('publishing skListEvent');
        console.log('skListEvent', skListEvent);
        await skListEvent.publish();
    }

    // TODO: Implement updateVenue
    // async update(pubkey: string, name: string, about: string, image: string) {
    //     // ...
    // }

    static async remove(hexkey: string, skList: SkList) {
        const $ndk = get(ndk);
        const $session = get(session);

        const sk = hexToBytes(hexkey);
        const pubkey = getPublicKey(sk);

        // Clear venue profile metadata
        const metadata = {
            name: '',
            about: '',
            image: ''
        };

        const metadataEvent = new NDKEvent($ndk, {
            pubkey: pubkey,
            content: JSON.stringify(metadata),
            created_at: Math.floor(Date.now() / 1000),
            kind: 0,
            tags: []
        });

        // Update sk list
        skList = skList.filter(([_, value]) => value !== hexkey);
        const skListEvent = new NDKEvent($ndk, {
            pubkey: $session.user!.pubkey as string,
            content: JSON.stringify(skList),
            created_at: Math.floor(Date.now() / 1000),
            kind: SK_LIST_KIND,
            tags: []
        });

        await skListEvent.encrypt($session.user, $ndk!.signer);
        await metadataEvent.sign(new NDKPrivateKeySigner(hexkey));

        await skListEvent.publish();
        metadataEvent.publish();
    }
}
