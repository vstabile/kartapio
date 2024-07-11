<script lang="ts">
    import ndk from '$stores/ndk';
    import { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
    import { v4 as uuidv4 } from 'uuid';
    import type { Stall, Venue } from '$stores/venues';
    import LucideImagePlus from '~icons/lucide/image-plus';
    import LucidePlus from '~icons/lucide/plus';
    import { superForm } from 'sveltekit-superforms';
    import { zodClient } from 'sveltekit-superforms/adapters';
    import { dishFormSchema } from './schema';
    import Button from '$components/ui/button/button.svelte';
    import { searchResults } from '$stores/search';

    export let venue: Venue;
    export let menu: Stall;

    let validating = false;
    let valid = false;
    let errors = {};

    const defaultForm = {
        name: '',
        description: '',
        price: 0
    };

    const { form, validateForm } = superForm(defaultForm, {
        validators: zodClient(dishFormSchema)
    });

    async function validate() {
        if (validating) return;
        validating = true;
        setTimeout(() => {
            validateForm().then((result) => {
                valid = result.valid;
                errors = result.errors;
                validating = false;
            });
        }, 500);
    }

    $: if ($form) validate();

    async function handleAdd() {
        const result = await validateForm();

        if (!result.valid) {
            return;
        }

        const content = { ...$form, id: uuidv4(), stall_id: menu!.id };

        let productEvent = new NDKEvent($ndk, {
            pubkey: venue!.pubkey,
            content: JSON.stringify(content),
            created_at: Math.floor(Date.now() / 1000),
            kind: 30018,
            tags: [['d', content.id]]
        });

        $form = defaultForm;

        await productEvent.sign(new NDKPrivateKeySigner(venue!.hexkey));
        await productEvent.publish();
    }
</script>

<form on:submit|preventDefault={handleAdd} class:hidden={$searchResults != undefined}>
    <div
        class="new-dish-container flex items-center justify-between space-x-4 text-sm sm:text-base"
    >
        <div class="flex items-center">
            <div class="hidden rounded-lg bg-white sm:flex">
                <LucideImagePlus class="h-10 w-10 rounded-lg text-gray-400" />
            </div>
            <div class="ml-0 sm:ml-3">
                <p class="text-sm font-medium leading-none">
                    <input
                        type="text"
                        placeholder="Dish name"
                        class="bg-transparent outline-none"
                        bind:value={$form.name}
                    />
                </p>
                <p class="text-sm text-muted-foreground">
                    <input
                        type="text"
                        placeholder="Dish description"
                        class="bg-transparent outline-none"
                        bind:value={$form.description}
                    />
                </p>
            </div>
        </div>
        <div class="flex items-center justify-end">
            <div class="text-right">
                <input
                    type="number"
                    placeholder="0"
                    class="w-14 bg-transparent text-right outline-none"
                    bind:value={$form.price}
                    class:text-gray-400={$form.price === 0}
                />
                <span class:text-gray-400={!$form.price}>{menu.currency}</span>
            </div>
            <div class="add-dish flex w-16 items-center justify-end" class:valid>
                <Button
                    variant="link"
                    on:click={handleAdd}
                    class="flex items-center px-0"
                    disabled={!valid}
                >
                    <LucidePlus class="h-4" /> Add
                </Button>
            </div>
        </div>
    </div>
</form>

<style>
    .new-dish-container .add-dish:not(.valid) {
        opacity: 0;
        width: 0;
        overflow: hidden;
        transition:
            opacity 0.5s ease,
            width 0.5s ease;
    }

    .new-dish-container:hover .add-dish {
        opacity: 1;
        width: 4.2rem;
    }
</style>
