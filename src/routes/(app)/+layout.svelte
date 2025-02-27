<script lang="ts">
    import '/src/app.css';
    import { onMount } from 'svelte';
    import ndk from '$stores/ndk';
    import Navbar from '$components/app/Navbar.svelte';
    import signIn from '$utils/sign-in';
    import session from '$stores/session';
    import { generateSecretKey } from 'nostr-tools/pure';
    import { bytesToHex } from '@noble/hashes/utils';

    onMount(async () => {
        // $ndk.cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'NostrMenu' });
        // $ndk.clientName = 'nostrMenu';

        // const sigWorker = import.meta.env.DEV ? new Worker(new URL('@nostr-dev-kit/ndk/workers/sig-verification?worker', import.meta.url), { type: 'module' }) : new NDKSigVerificationWorker();
        // $ndk.signatureVerificationWorker = sigWorker;
        await $ndk.connect(10000);

        // Generate a disposable key for guest users
        // let disposableKey = generateSecretKey();
        // const hexkey = bytesToHex(disposableKey);
        // session.setPrivateKey(hexkey);
        // signIn('guest');
    });
</script>

<Navbar />

<div class="h-screen bg-gray-50 px-4 py-8 sm:px-10 sm:pt-10">
    <slot />
</div>
