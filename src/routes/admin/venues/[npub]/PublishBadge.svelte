<script lang="ts">
    import { Badge } from '$lib/components/ui/badge';
    import LucideChevronDown from '~icons/lucide/chevron-down';
    import * as DropdownBadge from '$components/ui/dropdown-badge';
    import { NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
    import { Venue, Stall } from '$stores/venues';

    export let venue: Venue;
    export let menu: Stall;

    let open = false;

    async function publish() {
        open = false;

        let stallEvent = menu.toEvent({
            draft: false,
            created_at: Math.floor(Date.now() / 1000)
        });

        await stallEvent.sign(new NDKPrivateKeySigner(venue.hexkey));
        stallEvent.publish();
    }
</script>

{#if menu.draft}
    <DropdownBadge.Root bind:open>
        <DropdownBadge.Trigger class="mr-2 mt-[-3px] text-xs">
            <Badge variant="destructive">
                <span class="mr-1">Draft</span><LucideChevronDown class="mr-[-3px]" />
            </Badge>
        </DropdownBadge.Trigger>
        <DropdownBadge.Content>
            <DropdownBadge.Item>
                <a href="/" on:click|preventDefault={publish}>Publish</a>
            </DropdownBadge.Item>
        </DropdownBadge.Content>
    </DropdownBadge.Root>
{/if}
