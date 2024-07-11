<script lang="ts">
    import type { HTMLAttributes } from 'svelte/elements';
    import { cn } from '$lib/utils.js';

    type $$Props = HTMLAttributes<HTMLDivElement>;

    let className: $$Props['class'] = undefined;
    export { className as class };
</script>

<div class={cn('flex items-center px-4 pb-2 pt-0 sm:px-6 sm:pb-6', className)} {...$$restProps}>
    <slot />
</div>
