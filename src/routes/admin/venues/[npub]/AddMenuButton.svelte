<script lang="ts">
    import { Button, buttonVariants } from '$lib/components/ui/button/index.js';
    import * as Dialog from '$lib/components/ui/dialog/index.js';
    import { Input } from '$lib/components/ui/input/index.js';
    import { Label } from '$lib/components/ui/label/index.js';
    import * as Command from '$lib/components/ui/command/index.js';
    import * as Popover from '$lib/components/ui/popover/index.js';
    import Check from 'lucide-svelte/icons/check';
    import ChevronsUpDown from 'lucide-svelte/icons/chevrons-up-down';
    import { tick } from 'svelte';
    import { cn } from '$lib/utils.js';
    import { superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { v4 as uuidv4 } from 'uuid';
    import type { Venue } from '$stores/venues';
    import MenuCommands from '$lib/commands/menu-commands';
    import { menuSchema } from '$lib/commands/schemas';
    import { LucideLoader } from 'lucide-svelte';

    export let venue: Venue;

    const currencies = ['USD', 'EUR', 'BRL'];

    let dialogOpen = false;
    let selectOpen = false;
    let waiting = false;

    $: selectedValue = $formData.currency ?? 'Select a currency...';

    function closeAndFocusTrigger(triggerId: string) {
        selectOpen = false;
        tick().then(() => {
            document.getElementById(triggerId)?.focus();
        });
    }

    function getDefaultForm() {
        return {
            id: uuidv4(),
            name: '',
            description: '',
            currency: 'EUR'
        };
    }

    const form = superForm(getDefaultForm(), {
        validators: zodClient(menuSchema)
    });

    const { form: formData } = form;

    async function add() {
        waiting = true;
        const list = venue.stalls.map((s) => s.id);
        MenuCommands.add(venue.hexkey!, venue.pubkey, $formData, list);
        $formData = getDefaultForm();
        waiting = false;
        dialogOpen = false;
    }
</script>

<Dialog.Root bind:open={dialogOpen}>
    <Dialog.Trigger class={buttonVariants({ variant: 'default' })}>Add Menu</Dialog.Trigger>
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title>New Menu</Dialog.Title>
        </Dialog.Header>
        <div class="grid gap-4 py-4">
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="name" class="text-right">Name</Label>
                <Input
                    id="name"
                    bind:value={$formData.name}
                    placeholder="i.e. Lunch Menu"
                    autocomplete="off"
                    class="col-span-3"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="description" class="text-right">Description</Label>
                <Input
                    id="description"
                    bind:value={$formData.description}
                    autocomplete="off"
                    class="col-span-3"
                />
            </div>
            <div class="grid grid-cols-4 items-center gap-4">
                <Label for="currency" class="text-right">Currency</Label>
                <Popover.Root bind:open={selectOpen} let:ids>
                    <Popover.Trigger asChild let:builder>
                        <Button
                            builders={[builder]}
                            variant="outline"
                            role="combobox"
                            aria-expanded={selectOpen}
                            class="col-span-3 w-full justify-between"
                        >
                            {selectedValue}
                            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content class="w-[200px] p-0">
                        <Command.Root>
                            <Command.Input placeholder="Search currency..." />
                            <Command.Empty>No currency found.</Command.Empty>
                            <Command.Group>
                                {#each currencies as currency}
                                    <Command.Item
                                        value={currency}
                                        onSelect={(currentValue) => {
                                            $formData.currency = currentValue;
                                            closeAndFocusTrigger(ids.trigger);
                                        }}
                                    >
                                        <Check
                                            class={cn(
                                                'mr-2 h-4 w-4',
                                                $formData.currency !== currency &&
                                                    'text-transparent'
                                            )}
                                        />
                                        {currency}
                                    </Command.Item>
                                {/each}
                            </Command.Group>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>
            </div>
        </div>
        <Dialog.Footer>
            <Button type="submit" on:click={add} disabled={waiting} class="w-full">
                {#if !waiting}
                    Add Menu
                {:else}
                    <LucideLoader class="animate-spin" />
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
