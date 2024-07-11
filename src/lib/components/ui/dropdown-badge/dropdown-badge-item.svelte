<script lang="ts">
    import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
    import { cn } from '$lib/utils.js';
    import { Badge } from '$lib/components/ui/badge';

    type $$Props = DropdownMenuPrimitive.ItemProps & {
        inset?: boolean;
    };
    type $$Events = DropdownMenuPrimitive.ItemEvents;

    let className: $$Props['class'] = undefined;
    export let inset: $$Props['inset'] = undefined;
    export { className as class };
</script>

<Badge
    class={cn(
        'relative mb-1 flex cursor-pointer select-none items-center text-xs outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground data-[disabled]:opacity-50',
        inset && 'pl-8',
        className
    )}
>
    <slot />
</Badge>
