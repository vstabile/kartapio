<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { cn } from '$lib/utils.js';

    type $$Props = HTMLAttributes<HTMLDivElement> & { draft?: boolean };

    let className: $$Props['class'] = undefined;
    export { className as class };
    export let draft = false;
</script>

<div
    class={cn(
        `rounded-lg border bg-card text-card-foreground shadow-sm ${draft ? 'draft' : ''}`,
        className
    )}
    {...$$restProps}
>
    <slot />
</div>

<style>
    .draft {
        background: repeating-linear-gradient(
            -45deg,
            #ffffff,
            #ffffff 10px,
            #f9f9f9 8px,
            #f9f9f9 18px
        );
    }
</style>
