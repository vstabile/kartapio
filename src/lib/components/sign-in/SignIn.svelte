<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import signIn from '$utils/sign-in';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { superForm } from 'sveltekit-superforms';
    import { signInSchema } from './schema';
    import LucideEye from '~icons/lucide/eye';
    import LucideEyeOff from '~icons/lucide/eye-off';
    import { NDKNip46Signer, NDKPrivateKeySigner, NDKUser } from '@nostr-dev-kit/ndk';
    import ndk from '$stores/ndk';
    import session from '$stores/session';
    import { LucideLoader } from 'lucide-svelte';

    export let mode;
    let showPassword = false;
    let usernameExists: boolean | undefined = undefined;
    const nsecBunkerDomain = import.meta.env.VITE_NSECBUNKER_DOMAIN;
    let popup: Window | null = null;
    let waiting = false;

    const form = superForm(
        { username: '', password: '' },
        { validators: zodClient(signInSchema), validationMethod: 'oninput' }
    );

    const { form: formData, errors } = form;

    function toggleShowPassword() {
        showPassword = !showPassword;
    }

    async function submit() {
        waiting = true;
        const identifier = [$formData.username, nsecBunkerDomain].join('@');
        let user = await NDKUser.fromNip05(identifier, $ndk, true);

        if (user === undefined) {
            waiting = false;
            usernameExists = false;
            return;
        }

        const localSigner = NDKPrivateKeySigner.generate();

        try {
            const remoteSigner = new NDKNip46Signer($ndk, user.pubkey, localSigner);

            remoteSigner.on('authUrl', (url: string) => {
                popup = window.open(url, '_blank', 'width=300,height=350');

                let checkPopup = setInterval(() => {
                    if (!popup || popup?.closed) {
                        waiting = false;
                        clearInterval(checkPopup);
                    }
                }, 500);
            });

            user = await remoteSigner.blockUntilReady();
            popup?.close();

            session.setPrivateKey(localSigner.privateKey!);
            signIn('nip46', user.pubkey);
        } catch (e: any) {
            console.error(e);
        }
    }
</script>

<div>
    <div class="pt-2">
        <form>
            <Input
                id="username"
                bind:value={$formData.username}
                on:keydown={() => (usernameExists = undefined)}
                type="text"
                placeholder="Username"
                autocomplete="off"
                class="col-span-3 mt-2"
            />
            {#if $formData.username && $errors.username}
                <p class="mt-1 text-xs text-red-500">{$errors.username[0]}</p>
            {/if}
            {#if usernameExists === false}
                <p class="mt-1 text-xs text-red-500">This username does not exist</p>
            {/if}
            <!-- <div class="relative flex w-full">
            <a
                href="/"
                on:click|preventDefault={toggleShowPassword}
                class="absolute right-4 top-5 text-gray-400"
                tabindex="-1"
            >
                <span class:hidden={showPassword}>
                    <LucideEye />
                </span>
                <span class:hidden={!showPassword}>
                    <LucideEyeOff />
                </span>
            </a>
            <Input
                id="password"
                bind:value={$formData.password}
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                class="col-span-3 mt-2"
            />
        </div>
        {#if $formData.password && $errors.password}
            <p class="mt-1 text-xs text-red-500">{$errors.password[0]}</p>
        {/if} -->

            <Button class="mt-4 w-full" on:click={submit} disabled={waiting} type="submit">
                {#if !waiting}
                    Sign In
                {:else}
                    <LucideLoader class="animate-spin" />
                {/if}
            </Button>
        </form>
        <p class="my-4 w-full text-center">Don't have an account yet?</p>

        <Button variant="secondary" class="w-full" on:click={() => (mode = 'signup')}
            >Sign Up</Button
        >
    </div>
    <div class="mt-4">
        Already have a Nostr account?
        <a href="/" on:click|preventDefault={() => (mode = 'advanced')} class="underline">
            Advanced</a
        >
    </div>
</div>
