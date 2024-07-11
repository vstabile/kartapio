<script lang="ts">
    import { AlertDialog as AlertDialogPrimitive } from 'bits-ui';
    import { buttonVariants, type Props as ButtonProps } from '$lib/components/ui/button/index.js';
    import { cn } from '$lib/utils.js';

    type $$Props = AlertDialogPrimitive.ActionProps & { variant?: $$ButtonProps['variant'] };
    type $$Events = AlertDialogPrimitive.ActionEvents;
    type $$ButtonProps = ButtonProps;

    let className: $$Props['class'] = undefined;
    export let variant: $$ButtonProps['variant'] = 'default';
    export { className as class };
</script>

<AlertDialogPrimitive.Action
    class={cn(buttonVariants({ variant }), className)}
    {...$$restProps}
    on:click
    on:keydown
    let:builder
>
    <slot {builder} />
</AlertDialogPrimitive.Action>
