<script lang="ts">
    import '/src/app.css';
    import { onMount } from 'svelte';
    import ndk from '$stores/ndk';
    import signIn from '$utils/sign-in';
    import Navbar from '$components/admin/Navbar.svelte';

    /**
     * Connects to the Nostr network and try to restore the user
     * session from the local storage.
     */
    onMount(async () => {
        // $ndk.cacheAdapter = new NDKCacheAdapterDexie({ dbName: 'NostrMenu' });
        // $ndk.clientName = 'nostrMenu';

        // const sigWorker = import.meta.env.DEV ? new Worker(new URL('@nostr-dev-kit/ndk/workers/sig-verification?worker', import.meta.url), { type: 'module' }) : new NDKSigVerificationWorker();
        // $ndk.signatureVerificationWorker = sigWorker;
        await $ndk.connect(10000);

        signIn();
    });
</script>

<Navbar />

<div class="h-full min-h-screen bg-purple-50 px-4 py-4 sm:px-10 sm:py-6">
    <slot />
</div>
