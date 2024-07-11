import { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import ndk from '$stores/ndk';
import { get } from 'svelte/store';
import { menuSchema, type Menu, type IdList } from './schemas';
import * as nip44 from 'nostr-tools/nip44';
import { hexToBytes } from '@noble/hashes/utils';

export default class MenuCommands {
    static async add(venueSecretKey: string, venuePubkey: string, menu: Menu, list: IdList) {
        const $ndk = get(ndk);

        const menuValidation = menuSchema.safeParse(menu);

        if (!menuValidation.success) {
            throw new Error(menuValidation?.error?.errors.map((err) => err.message).join(', '));
        }

        let stallEvent = new NDKEvent($ndk, {
            pubkey: venuePubkey,
            content: JSON.stringify(menu),
            created_at: Math.floor(Date.now() / 1000),
            kind: 30017,
            tags: [['d', menu.id]]
        });

        const plainPayload = JSON.stringify(stallEvent.rawEvent());
        const conversationKey = nip44.getConversationKey(hexToBytes(venueSecretKey), venuePubkey);
        const encryptedPayload = nip44.encrypt(plainPayload, conversationKey);

        let stallDraftEvent = new NDKEvent($ndk, {
            pubkey: venuePubkey,
            content: encryptedPayload,
            created_at: Math.floor(Date.now() / 1000),
            kind: 31234,
            tags: [
                ['d', menu.id],
                ['k', '30017']
            ]
        });

        const aTags = [...list, menu.id].map((id) => ['a', `30017:${venuePubkey}:${id}`]);
        const bookmarkEvent = new NDKEvent($ndk, {
            pubkey: venuePubkey,
            content: '',
            created_at: Math.floor(Date.now() / 1000),
            kind: 30003,
            tags: [...[['d', 'stalls']], ...aTags]
        });

        await stallDraftEvent.sign(new NDKPrivateKeySigner(venueSecretKey));
        await bookmarkEvent.sign(new NDKPrivateKeySigner(venueSecretKey));
        stallDraftEvent.publish();
        bookmarkEvent.publish();
    }
}
