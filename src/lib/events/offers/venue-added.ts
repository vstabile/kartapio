import { DomainEvent } from '../event';
import type { NDKEvent } from '@nostr-dev-kit/ndk';

export class VenueAdded extends DomainEvent {
    name?: string;
    about?: string;
    image?: string;

    constructor(public readonly event: NDKEvent) {
        super(event);

        let content;
        try {
            content = JSON.parse(event.content);
        } catch (e) {
            throw new Error('Invalid event');
        }
        this.name = content.name;
        this.about = content.about;
        this.image = content.image;
    }

    process() {
        super.process();
        // State.handleVenueAdded(this);
        console.log(`Venue added at ${this.createdAt}`);
    }
}
