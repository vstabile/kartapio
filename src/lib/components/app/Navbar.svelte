<script lang="ts">
    import SignInButton from '$components/sign-in/SignInButton.svelte';
</script>

<nav class="flex items-center justify-between bg-gray-600 px-10 py-4">
    <div class="mr-6 flex flex-shrink-0 items-center text-white">
        <a class="text-xl font-semibold tracking-tight text-white no-underline" href="/">Kartapio</a
        >
    </div>
    <div class="flex w-full flex-grow items-center justify-between">
        <div class="text-sm"></div>
        <div>
            <SignInButton />
        </div>
    </div>
</nav>
