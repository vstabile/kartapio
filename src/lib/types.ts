import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

export type UserProfile = NDKUserProfile & {
    created_at: number;
};

export interface Venue {
    sk: Array<number>;
    pubkey: string;
    name?: string;
    about?: string;
    image?: string;
    updated_at?: number;
}
