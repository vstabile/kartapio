<script lang="ts">
    import SignInButton from '$components/sign-in/SignInButton.svelte';
    import session from '$stores/session';
</script>

<nav class="flex items-center justify-between bg-purple-600 px-4 py-4 sm:px-10">
    <div class="mr-12 flex flex-shrink-0 items-center text-white">
        <a class="text-xl font-semibold tracking-tight text-white no-underline" href="/admin/venues"
            >Kartapio</a
        >
    </div>
    <div class="flex w-full flex-grow items-center justify-between">
        <div class="flex text-sm">
            {#if $session.user}
                <a href="/admin/venues" class=" mr-6 text-purple-100 no-underline hover:text-white">
                    Venues
                </a>
            {/if}
        </div>
        <div>
            <SignInButton />
        </div>
    </div>
</nav>
