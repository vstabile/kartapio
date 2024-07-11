import { DropdownMenu as DropdownMenuPrimitive } from 'bits-ui';
import Content from './dropdown-badge-content.svelte';
import Item from './dropdown-badge-item.svelte';

const Root = DropdownMenuPrimitive.Root;
const Trigger = DropdownMenuPrimitive.Trigger;

export {
    Root,
    Item,
    Trigger,
    Content,
    //
    Root as DropdownBadge,
    Item as DropdownBadgeItem,
    Content as DropdownBadgeContent,
    Trigger as DropdownBadgeTrigger
};
