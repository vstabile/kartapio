<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { cn } from '$lib/utils.js';

    type $$Props = HTMLAttributes<HTMLDivElement>;

    let className: $$Props['class'] = undefined;
    export { className as class };
</script>

<div class={cn('px-4 py-0 sm:px-6', className)} {...$$restProps}>
    <slot />
</div>
