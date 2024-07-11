<script lang="ts">
    import * as Table from '$lib/components/ui/table';
    import venues from '$stores/venues';
    import LucideEye from '~icons/lucide/eye';
    import LucideEdit from '~icons/lucide/edit';
    import LucideImage from '~icons/lucide/image';
    import AddVenueButton from './AddVenueButton.svelte';
    import session from '$stores/session';
</script>

{#if $session.user}
    <div class="mb-2 flex justify-between">
        <h1 class="text-xl font-bold">My Venues</h1>
        <AddVenueButton />
    </div>

    <Table.Root>
        <Table.Header>
            <Table.Row class="hover:bg-transparent">
                <Table.Head class="w-[60px]"></Table.Head>
                <Table.Head class="w-[200px] pl-1">Name</Table.Head>
                <Table.Head>Description</Table.Head>
                <Table.Head class="text-right"></Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#if $venues}
                {#each $venues as venue (venue.npub)}
                    <Table.Row>
                        <Table.Cell class="w-[60px] p-1">
                            <div class="flex items-center justify-center">
                                {#if venue.picture}
                                    <img src={venue.picture} alt="venue-profile" />
                                {:else}
                                    <LucideImage class="h-8 w-8 rounded-lg text-gray-400" />
                                {/if}
                            </div>
                        </Table.Cell>
                        <Table.Cell class="w-[200px] pl-1 font-medium">{venue.name}</Table.Cell>
                        <Table.Cell>{venue.about}</Table.Cell>
                        <Table.Cell class="flex justify-end text-right">
                            <a href="/venues/{venue.npub}" target="_blank" class="mr-2">
                                <LucideEye />
                            </a>
                            <a href="/admin/venues/{venue.npub}" class="mr-2">
                                <LucideEdit />
                            </a>
                        </Table.Cell>
                    </Table.Row>
                {/each}
            {/if}
        </Table.Body>
    </Table.Root>
{/if}
