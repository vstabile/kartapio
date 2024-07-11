<script lang="ts">
    import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import { venueSchema } from '$lib/commands/schemas';
    import { superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import venues from '$stores/venues';
    import VenueCommands from '$lib/commands/venue-commands';
    import { LucideLoader } from 'lucide-svelte';

    $: list = $venues.map((v) => ['sk', v.hexkey]) as ['sk', string][];

    let dialogOpen = false;
    let waiting = false;

    const defaultForm = {
        name: '',
        about: '',
        picture: ''
    };

    const form = superForm(
        { name: '', about: '', picture: '' },
        { validators: zodClient(venueSchema) }
    );

    const { form: formData } = form;

    async function add() {
        waiting = true;
        await VenueCommands.add($formData, list);
        $formData = defaultForm;
        waiting = false;
        dialogOpen = false;
    }
</script>

<Dialog.Root bind:open={dialogOpen}>
    <Dialog.Trigger class={buttonVariants({ variant: 'default' })}>Add Venue</Dialog.Trigger>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>Add Venue</Dialog.Title>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">Name</Label>
                <Input
                    id="name"
                    bind:value={$formData.name}
                    placeholder="The public name of your venue"
                    autocomplete="off"
                    class="col-span-3"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="description" class="text-right">Description</Label>
                <Input
                    id="description"
                    bind:value={$formData.about}
                    autocomplete="off"
                    class="col-span-3"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="picture" class="text-right">Picture</Label>
                <Input
                    id="picture"
                    bind:value={$formData.picture}
                    autocomplete="off"
                    class="col-span-3"
                />
            </div>
        </div>
        <Dialog.Footer>
            <Button type="submit" on:click={add} disabled={waiting} class="w-full">
                {#if !waiting}
                    Add Venue
                {:else}
                    <LucideLoader class="animate-spin" />
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
