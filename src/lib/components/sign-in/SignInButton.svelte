<script lang="ts">
    import session, { userProfile } from '$stores/session';
    import * as Dialog from '$lib/components/ui/dialog';
    import { Button } from '$lib/components/ui/button';
    import SignIn from './SignIn.svelte';
    import SignUp from './SignUp.svelte';
    import AdvancedSignIn from './AdvancedSignIn.svelte';
    import LucideCircleUser from '~icons/lucide/circle-user';
    import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
    import { signOut } from '$utils/sign-in';

    let mode: 'signin' | 'signup' | 'advanced' = 'signin';
</script>

{#if !$session.user}
    <Dialog.Root>
        <Dialog.Trigger>
            <Button>Sign In</Button>
        </Dialog.Trigger>
        <Dialog.Content class="max-w-xs">
            <Dialog.Header>
                <Dialog.Title>
                    {#if mode === 'signup'}
                        Sign Up
                    {:else}
                        Sign In
                    {/if}
                </Dialog.Title>
                <Dialog.Description>
                    {#if mode === 'signin'}
                        <SignIn bind:mode />
                    {:else if mode === 'signup'}
                        <SignUp bind:mode />
                    {:else if mode === 'advanced'}
                        <AdvancedSignIn bind:mode />
                    {/if}
                </Dialog.Description>
            </Dialog.Header>
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <DropdownMenu.Root>
        <DropdownMenu.Trigger>
            <div class="flex flex-row items-center gap-4 rounded-md">
                {#if $userProfile?.image}
                    <img
                        src={$userProfile.image}
                        class="m-0 h-8 w-8 rounded-full object-cover"
                        alt="profilepic"
                    />
                {:else}
                    <LucideCircleUser class="h-8 w-8 rounded-full bg-white" />
                {/if}
            </div>
        </DropdownMenu.Trigger>
        <DropdownMenu.Content>
            <DropdownMenu.Group>
                <DropdownMenu.Label>
                    <a href="/admin/profile">My Account</a>
                </DropdownMenu.Label>
                <DropdownMenu.Separator />
                <DropdownMenu.Item>
                    <a href="/" on:click|preventDefault={signOut}>Sign Out</a>
                </DropdownMenu.Item>
            </DropdownMenu.Group>
        </DropdownMenu.Content>
    </DropdownMenu.Root>
{/if}
