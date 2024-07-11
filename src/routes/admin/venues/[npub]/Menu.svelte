<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { Stall, Venue } from '$stores/venues';
    import Dish from './Dish.svelte';
    import LucideEdit from '~icons/lucide/edit';
    import LucideTrash2 from '~icons/lucide/trash-2';
    import LucideCheck from '~icons/lucide/check';
    import LucideX from '~icons/lucide/x';
    import { menuFormSchema } from './schema';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { superForm } from 'sveltekit-superforms';
    import isEqual from 'lodash.isequal';
    import { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
    import ndk from '$stores/ndk';
    import { toast } from 'svelte-sonner';
    import NewDish from './NewDish.svelte';
    import Sortable from 'sortablejs';
    import { onDestroy, onMount } from 'svelte';
    import LucideGripVertical from '~icons/lucide/grip-vertical';
    import PublishBadge from './PublishBadge.svelte';

    export let venue: Venue;
    export let menu: Stall;

    let data = { name: '', description: '' };
    let form: any;
    let validateForm: any;

    $: {
        data = {
            name: menu.name!,
            description: menu.description!
        };
        ({ form, validateForm } = superForm(data, {
            validators: zodClient(menuFormSchema)
        }));
    }

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

        if (!result.valid) {
            return;
        }

        editing = false;

        const updateEvent = menu!.toEvent({
            ...$form,
            created_at: Math.floor(Date.now() / 1000)
        });

        await updateEvent.sign(new NDKPrivateKeySigner(venue!.hexkey));
        await updateEvent.publish();
    }

    async function handleDelete(menu: Stall | undefined) {
        if (!venue || !menu) return;

        const kind = menu.draft ? 31234 : 30017;
        let deleteEvent = new NDKEvent($ndk, {
            pubkey: venue.pubkey,
            content: '',
            created_at: Math.floor(Date.now() / 1000),
            kind: 5,
            tags: [['a', `${kind}:${venue.pubkey}:${menu.id}`]]
        });

        await deleteEvent.sign(new NDKPrivateKeySigner(venue.hexkey));
        deleteEvent.publish();

        toast.success(`${menu.name} has been deleted`, {
            icon: LucideTrash2,
            action: {
                label: 'Undo',
                onClick: async () => {
                    const undoEvent = menu.toEvent({
                        created_at: Math.floor(Date.now() / 1000) + 1,
                        sk: venue.sk
                    });

                    await undoEvent.sign(new NDKPrivateKeySigner(venue!.hexkey));
                    undoEvent.publish();
                }
            }
        });
    }

    let dishesList: HTMLElement | undefined;
    let sortable: Sortable | undefined;

    onMount(() => {
        sortable = Sortable.create(dishesList!, {
            group: { name: 'dishes', pull: true, put: true },
            animation: 200,
            handle: '.dish-handle',
            onChoose: function (_) {
                dishesList?.classList.add('sorting');
            },
            onUnchoose: function (_) {
                dishesList?.classList.remove('sorting');
            },
            onEnd: async (event) => {
                if (event.from === event.to && event.oldIndex === event.newIndex) return;
                const ids = Array.from(event.from.children).map((el) => el.id);
                const aTags = ids.map((id) => ['a', `30018:${venue.pubkey}:${id}`]);
                const dTag = ['d', `30017:${venue.pubkey}:${event.from.dataset.id}`];
                const sortingEvent = new NDKEvent($ndk, {
                    pubkey: venue.pubkey,
                    content: '',
                    created_at: Math.floor(Date.now() / 1000),
                    kind: 30003,
                    tags: [...[dTag], ...aTags]
                });

                await sortingEvent.sign(new NDKPrivateKeySigner(venue.hexkey));

                let updateDishEvent;
                let sortingEvent2;
                if (event.from != event.to) {
                    let ids2 = Array.from(event.to.children)
                        .map((el) => el.id)
                        .filter((id) => id !== event.item.id);
                    ids2.splice(event.newIndex!, 0, event.item.id);
                    const aTags2 = ids2.map((id) => ['a', `30018:${venue.pubkey}:${id}`]);
                    const dTag2 = ['d', `30017:${venue.pubkey}:${event.to.dataset.id}`];
                    sortingEvent2 = new NDKEvent($ndk, {
                        pubkey: venue.pubkey,
                        content: '',
                        created_at: Math.floor(Date.now() / 1000),
                        kind: 30003,
                        tags: [...[dTag2], ...aTags2]
                    });

                    const dish = venue.stalls
                        .find((stall) => stall.id === event.from.dataset.id)
                        ?.products.find((dish) => dish.id === event.item.id);

                    updateDishEvent = dish!.toEvent({
                        stall_id: event.to.dataset.id,
                        created_at: Math.floor(Date.now() / 1000)
                    });

                    await updateDishEvent.sign(new NDKPrivateKeySigner(venue.hexkey));
                    await sortingEvent2.sign(new NDKPrivateKeySigner(venue.hexkey));
                }

                sortingEvent.publish();
                if (sortingEvent2 && updateDishEvent) {
                    sortingEvent2.publish();
                    updateDishEvent.publish();
                    event.item.remove();
                }
            }
        });
    });

    onDestroy(() => {
        sortable?.destroy();
    });
</script>

<Card.Root class="flex flex-col" id={menu.id} draft={menu.draft}>
    <Card.Header class="menu-header">
        <Card.Title class="flex justify-between">
            <input
                type="text"
                bind:value={$form.name}
                placeholder="Menu name"
                class="bg-transparent outline-none"
                disabled={!editing}
            />
            <div class="flex items-start" class:editing>
                {#if !editing}
                    <PublishBadge {venue} {menu} />
                    <a href="/" on:click|preventDefault={startEditing}>
                        <LucideEdit class="h-4 text-gray-600" />
                    </a>
                    <a href="/" on:click|preventDefault={() => handleDelete(menu)}>
                        <LucideTrash2 class="h-4 text-red-600" />
                    </a>
                {:else}
                    <a href="/" on:click|preventDefault={handleUpdate}
                        ><LucideCheck class="mr-1 h-4" /></a
                    >
                    <a href="/" on:click|preventDefault={cancelEditing}>
                        <LucideX class="h-4 text-red-600" />
                    </a>
                {/if}
                <div class="menu-handle flex">
                    <LucideGripVertical class="h-4 text-gray-600" />
                </div>
            </div>
        </Card.Title>
        <Card.Description>
            <input
                type="text"
                bind:value={$form.description}
                placeholder="Menu description"
                class="bg-transparent outline-none"
                disabled={!editing}
            />
        </Card.Description>
    </Card.Header>
    <div class="flex h-full flex-col justify-between">
        <Card.Content class="h-full">
            <div class="dishes-list h-full" bind:this={dishesList} data-id={menu.id}>
                {#if menu.products?.length > 0}
                    {#each menu.products as dish (dish.id)}
                        <Dish {venue} {dish} {menu} />
                    {/each}
                {/if}
            </div>
        </Card.Content>
        <Card.Footer class="block">
            {#if menu}
                <NewDish {venue} {menu} />
            {/if}
        </Card.Footer>
    </div>
</Card.Root>

<style>
    .menu-handle {
        opacity: 1;
        width: 1.2rem;
        cursor: grab;
        transition:
            opacity 0.5s ease,
            width 0.5s ease;
    }

    .editing .menu-handle {
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition:
            opacity 0.5s ease,
            width 0.5s ease;
    }
</style>
