import {
    NDKNip07Signer,
    NDKPrivateKeySigner,
    NDKNip46Signer,
    NDKUser,
    type Hexpubkey
} from '@nostr-dev-kit/ndk';
import { get } from 'svelte/store';
import ndk from '$stores/ndk';
import session, { type SignInMethod, userProfile, skList } from '$stores/session';
import { prepareSession } from '$stores/session';
import venues from '$stores/venues';
import { goto } from '$app/navigation';

export type LoginMethod = 'none' | 'pk' | 'nip07' | 'nip46' | 'guest';

const $ndk = get(ndk);

// Attempts to sign in using whatever method was previously used
async function signIn(method?: SignInMethod, remotePubkey?: Hexpubkey) {
    const $session = get(session);
    method ??= $session.signInMethod || 'none';
    remotePubkey ??= $session.remotePubkey;

    switch (method) {
        case 'pk': {
            await pkSignIn();
            break;
        }
        case 'nip07': {
            await nip07SignIn();
            break;
        }
        case 'nip46': {
            if (remotePubkey) await nip46SignIn(remotePubkey);
            break;
        }
        case 'guest': {
            await pkSignIn();
            break;
        }
    }

    clearReadModels();
    prepareSession();
}

export default signIn;

async function pkSignIn() {
    const privateKey = get(session).privateKey;
    if (!privateKey) {
        session.clear();
        return null;
    }
    $ndk.signer = new NDKPrivateKeySigner(privateKey);
    const user = await $ndk.signer?.blockUntilReady();
    user.ndk = $ndk;
    session.setUser(user, 'pk');
}

async function nip07SignIn() {
    if (window.nostr) {
        $ndk.signer = new NDKNip07Signer();
        const user = await $ndk.signer?.blockUntilReady();
        user.ndk = $ndk;
        session.setUser(user, 'nip07');
    } else {
        session.clear();
    }
}

export async function nip46SignIn(remotePubkey: Hexpubkey, privateKey?: Hexpubkey) {
    privateKey ??= get(session).privateKey;
    if (!privateKey) return;

    let remoteUser: NDKUser;
    remoteUser = $ndk.getUser({ pubkey: remotePubkey });
    if (!remoteUser) return;
    const localSigner = new NDKPrivateKeySigner(privateKey);
    const remoteSigner = new NDKNip46Signer($ndk, remoteUser.pubkey, localSigner);
    remoteUser = await remoteSigner.blockUntilReady();
    $ndk.signer = remoteSigner;
    console.log('$ndk', $ndk);
    remoteUser.ndk = $ndk;

    session.setUser(remoteUser, 'nip46', privateKey);
}

export function signOut(): void {
    clearReadModels();
    $ndk.signer = undefined;
    session.clear();
    userProfile.set(undefined);

    goto('/');
}

function clearReadModels() {
    skList.set(undefined);
    venues.clear();
}
