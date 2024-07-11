<script lang="ts">
    import Label from '../ui/label/label.svelte';
    import Separator from '../ui/separator/separator.svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import signIn from '$utils/sign-in';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { nsecSchema, npubSchema } from './schema';
    import { superForm } from 'sveltekit-superforms';
    import { nip19 } from 'nostr-tools';
    import { bytesToHex } from '@noble/hashes/utils';
    import session from '$stores/session';

    export let mode;

    const nsecForm = superForm(
        { key: '' },
        { validators: zodClient(nsecSchema), validationMethod: 'oninput' }
    );
    const npubForm = superForm(
        { key: '' },
        { validators: zodClient(npubSchema), validationMethod: 'oninput' }
    );

    const { form: nsecData, errors: nsecErrors } = nsecForm;
    const { form: npubData, errors: npubErrors } = npubForm;

    $: keyIsValid =
        ($nsecData.key !== '' && !$nsecErrors.key) || ($npubData.key !== '' && !$npubErrors.key);

    function handleKeySignIn() {
        if ($nsecData.key) {
            const key = nip19.decode($nsecData.key).data as Uint8Array;
            const hexkey = bytesToHex(key);
            session.setPrivateKey(hexkey);
        } else if ($npubData.key) {
            throw new Error('Public key sign in not supported yet');
        } else {
            throw new Error('Invalid key');
        }

        signIn('pk');
    }
</script>

<div>
    <p class="pt-2">Use your existing Nostr account</p>
    <div class="flex py-4">
        <Button on:click={() => signIn('nip07')} class="w-full">Sign In with Extension</Button>
    </div>
    <Separator class="my-2 w-full" />
    <div class="pt-2">
        <div>
            <Label for="nsec" class="mb-2 block">Private key</Label>
            <Input
                id="nsec"
                type="text"
                placeholder="nsec..."
                autocomplete="off"
                bind:value={$nsecData.key}
                on:keyup={() => {
                    if ($nsecData.key) $npubData.key = '';
                }}
            />
            {#if $nsecData.key && $nsecErrors.key}
                <p class="mt-1 text-xs text-red-500">{$nsecErrors.key[0]}</p>
            {/if}
        </div>
        <div class="pt-2" hidden={true}>
            <Label for="npub" class="my-2 block">Public key (read access)</Label>
            <Input
                id="npub"
                type="text"
                placeholder="npub..."
                autocomplete="off"
                bind:value={$npubData.key}
                on:keyup={() => {
                    if ($npubData.key) $nsecData.key = '';
                }}
            />
            {#if $npubData.key && $npubErrors.key}
                <p class="mt-1 text-xs text-red-500">{$npubErrors.key[0]}</p>
            {/if}
        </div>
        <div class="py-4">
            <Button on:click={handleKeySignIn} class="w-full" disabled={!keyIsValid}
                >Sign In with Key</Button
            >
        </div>
    </div>
    <div class="flex justify-center">
        <Button variant="link" on:click={() => (mode = 'signin')} class="h-auto pb-0">Back</Button>
    </div>
</div>
