<script lang="ts">
    import { skList } from '$stores/session';
    import Button from '$components/ui/button/button.svelte';
    import { Venue } from '$stores/venues';
    import { goto } from '$app/navigation';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import VenueCommands from '$lib/commands/venue-commands';

    export let venue: Venue;

    $: list = $skList?.tags as ['sk', string][];

    async function remove() {
        VenueCommands.remove(venue.hexkey!, list);

        goto('/admin/venues');
    }
</script>

<AlertDialog.Root>
    <AlertDialog.Trigger>
        <Button variant="destructive">Delete Venue</Button>
    </AlertDialog.Trigger>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Are you sure you want to delete {venue.name}?</AlertDialog.Title>
            <AlertDialog.Description>
                This action cannot be undone and you won't be able to manage this venue anymore.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
            <AlertDialog.Action variant="destructive" on:click={remove}>Delete</AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
