import type { NDKEvent } from '@nostr-dev-kit/ndk';

export class DomainEvent {
    createdAt: number;

    constructor(public readonly event: NDKEvent) {
        if (!event.created_at) throw new Error('Invalid event');
        this.createdAt = event.created_at;
    }

    process() {
        console.log(`Event processed at ${this.createdAt}`);
    }
}
