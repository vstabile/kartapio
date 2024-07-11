<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { superForm } from 'sveltekit-superforms';
    import LucideEye from '~icons/lucide/eye';
    import LucideEyeOff from '~icons/lucide/eye-off';
    import LucideLoader from '~icons/lucide/loader';
    import { signUpSchema } from './schema';
    import ndk from '$stores/ndk';
    import { NDKPrivateKeySigner, NDKNip46Signer, NDKUser } from '@nostr-dev-kit/ndk';
    import session from '$stores/session';
    import signIn from '$utils/sign-in';

    export let mode;
    let showPassword = false;
    let usernameTaken = false;

    let popup: Window | null = null;
    let waiting = false;

    $: valid =
        !usernameTaken &&
        Object.values($errors).every((v) => v === undefined) &&
        $formData.username.length > 0 &&
        $formData.email.length;

    const form = superForm(
        { username: '', email: '', password: '', confirmPassword: '' },
        { validators: zodClient(signUpSchema), validationMethod: 'oninput' }
    );

    const { form: formData, errors } = form;

    const nsecBunkerDomain = import.meta.env.VITE_NSECBUNKER_DOMAIN;
    const nsecBunkerPubkey = import.meta.env.VITE_NSECBUNKER_PUBKEY;

    function toggleShowPassword() {
        showPassword = !showPassword;
    }

    async function checkUsername() {
        if ($formData.username.length === 0) return;

        const identifier = [$formData.username, nsecBunkerDomain].join('@');
        const user = await NDKUser.fromNip05(identifier, $ndk, true);

        usernameTaken = user !== undefined;
    }

    async function signUp() {
        waiting = true;
        const localSigner = NDKPrivateKeySigner.generate();
        const signer = new NDKNip46Signer($ndk, nsecBunkerPubkey, localSigner);

        signer.rpc.on('authUrl', (url: string) => {
            popup = window.open(url, '_blank', 'width=400,height=600');

            let checkPopup = setInterval(() => {
                if (!popup || popup?.closed) {
                    waiting = false;
                    clearInterval(checkPopup);
                }
            }, 500);
        });

        try {
            const remotePubkey = await signer.createAccount(
                $formData.username,
                nsecBunkerDomain,
                $formData.email
            );
            popup?.close();

            const remoteSigner = new NDKNip46Signer($ndk, remotePubkey, localSigner);
            const user = await remoteSigner.blockUntilReady();

            session.setPrivateKey(localSigner.privateKey!);
            signIn('nip46', user.pubkey);
        } catch (e) {
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
                on:blur={checkUsername}
                type="text"
                placeholder="Username"
                autocomplete="off"
                class="col-span-3 mt-2"
            />
            {#if $formData.username && $errors.username}
                <p class="mt-1 text-xs text-red-500">{$errors.username[0]}</p>
            {/if}
            {#if usernameTaken}
                <p class="mt-1 text-xs text-red-500">This username is already taken</p>
            {/if}
            <Input
                id="email"
                bind:value={$formData.email}
                type="text"
                placeholder="Recovery Email"
                class="col-span-3 mt-2"
            />
            {#if $formData.email && $errors.email}
                <p class="mt-1 text-xs text-red-500">{$errors.email[0]}</p>
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
        {/if}
        {#if $formData.password && !$errors.password}
            <Input
                id="confirm-password"
                bind:value={$formData.confirmPassword}
                type="password"
                placeholder="Confirm Password"
                class="col-span-3 mt-2"
            />
            {#if $formData.confirmPassword && $errors.confirmPassword}
                <p class="mt-1 text-xs text-red-500">{$errors.confirmPassword[0]}</p>
            {/if}
        {/if} -->
            <Button
                class="mt-4 w-full"
                on:click={signUp}
                disabled={!valid || waiting}
                type="submit"
            >
                {#if !waiting}
                    Sign Up
                {:else}
                    <LucideLoader class="animate-spin" />
                {/if}
            </Button>
        </form>
    </div>
    <div class="mt-2 flex justify-center">
        <Button variant="link" on:click={() => (mode = 'signin')} class="h-auto pb-0">
            Back to Sign In
        </Button>
    </div>
</div>
