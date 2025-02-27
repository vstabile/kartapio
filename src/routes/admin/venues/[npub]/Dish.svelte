<script lang="ts">
    import ndk from '$stores/ndk';
    import { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
    import type { Product, Stall, Venue } from '$stores/venues';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { superForm } from 'sveltekit-superforms';
    import { dishFormSchema } from './schema';
    import LucideImage from '~icons/lucide/image';
    import LucideEdit from '~icons/lucide/edit';
    import LucideTrash2 from '~icons/lucide/trash-2';
    import LucideCheck from '~icons/lucide/check';
    import LucideX from '~icons/lucide/x';
    import { toast } from 'svelte-sonner';
    import isEqual from 'lodash.isequal';
    import { searchResults } from '$stores/search';
    import LucideGripVertical from '~icons/lucide/grip-vertical';

    export let venue: Venue;
    export let menu: Stall;
    export let dish: Product;

    const data = {
        name: dish.name,
        description: dish.description,
        price: dish.price
    };

    const { form, validateForm } = superForm(data, {
        validators: zodClient(dishFormSchema)
    });

    let editing = false;

    function startEditing() {
        editing = true;
    }

    function cancelEditing() {
        form.set(data);
        editing = false;
    }

    async function handleUpdate() {
        if (isEqual($form, data)) {
            editing = false;
            return;
        }

        const result = await validateForm();

        if (!result.valid) return;

        editing = false;

        const updateEvent = dish.toEvent({
            ...$form,
            created_at: Math.floor(Date.now() / 1000)
        });

        await updateEvent.sign(new NDKPrivateKeySigner(venue.hexkey));
        await updateEvent.publish();
    }

    async function handleDelete(dish: Product) {
        if (!venue || !menu) return;
        let deleteEvent = new NDKEvent($ndk, {
            pubkey: venue.pubkey,
            content: '',
            created_at: Math.floor(Date.now() / 1000),
            kind: 5,
            tags: [['a', `30018:${venue.pubkey}:${dish.id}`]]
        });

        await deleteEvent.sign(new NDKPrivateKeySigner(venue.hexkey));
        deleteEvent.publish();

        toast.success(`${dish.name} has been deleted`, {
            icon: LucideTrash2,
            action: {
                label: 'Undo',
                onClick: async () => {
                    const undoEvent = dish.toEvent({
                        created_at: Math.floor(Date.now() / 1000) + 1
                    });
                    await undoEvent.sign(new NDKPrivateKeySigner(venue.hexkey));
                    undoEvent.publish();
                }
            }
        });
    }
</script>

<div
    class="dish-container mb-2 flex items-center justify-between space-x-4 pb-2 text-sm last:pb-2 sm:pb-0 sm:text-base sm:last:pb-6"
    id={dish.id}
    class:editing
    class:hidden={$searchResults && !$searchResults.includes(dish.id)}
>
    <div class="flex items-center">
        <div class="hidden sm:flex">
            {#if dish.images?.length > 0}
                <img
                    src={dish.images.at(0)}
                    alt={dish.name}
                    class="h-12 w-12 rounded-lg object-cover"
                />
            {:else}
                <LucideImage class="h-10 w-10 rounded-lg text-gray-400" />
            {/if}
        </div>
        <div class="ml-0 sm:ml-3">
            <p class="text-sm font-medium leading-none">
                <input
                    type="text"
                    bind:value={$form.name}
                    class="bg-transparent outline-none"
                    disabled={!editing}
                    class:colorPulse={editing}
                />
            </p>
            <p class="text-sm text-muted-foreground">
                <input
                    type="text"
                    bind:value={$form.description}
                    class="bg-transparent outline-none"
                    disabled={!editing}
                    class:colorPulse={editing}
                />
            </p>
        </div>
    </div>
    <div class="flex justify-end">
        <div class="dish-price text-right">
            <input
                type="number"
                class="w-14 bg-transparent text-right outline-none"
                bind:value={$form.price}
                disabled={!editing}
            />
            {menu.currency}
        </div>
        <div class="dish-actions flex w-16 items-center justify-end" class:editing>
            {#if !editing}
                <a href="/" on:click|preventDefault={startEditing}>
                    <LucideEdit class="h-4 text-gray-600" />
                </a>
                <a href="/" on:click|preventDefault={() => handleDelete(dish)}>
                    <LucideTrash2 class="h-4 text-red-600" />
                </a>
            {:else}
                <a href="/" on:click|preventDefault={handleUpdate}>
                    <LucideCheck class="mr-1 h-4" />
                </a>
                <a href="/" on:click|preventDefault={cancelEditing}>
                    <LucideX class="h-4 text-red-600" />
                </a>
            {/if}
        </div>
        <div class="dish-handle flex items-center pl-1">
            <LucideGripVertical class="h-4 text-gray-600" />
        </div>
    </div>
</div>

<style>
    .dish-container .dish-actions:not(.editing) {
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition:
            opacity 0.5s ease,
            width 0.5s ease;
    }

    .dishes-list:not(.sorting) .dish-container:hover .dish-actions {
        opacity: 1;
        width: 4rem;
    }

    .dish-handle {
        opacity: 1;
        width: 1.2rem;
        cursor: grab;
        transition:
            opacity 0.5s ease,
            width 0.5s ease;
    }

    .editing .dish-handle {
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition:
            opacity 0.5s ease,
            width 0.5s ease;
    }
</style>
