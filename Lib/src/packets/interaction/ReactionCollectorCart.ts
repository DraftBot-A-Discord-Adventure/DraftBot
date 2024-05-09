import {
	ReactionCollector,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorReaction
} from "./ReactionCollectorPacket";

export class ReactionCollectorCartValidate extends ReactionCollectorReaction {
}

export class ReactionCollectorCartRefuse extends ReactionCollectorReaction {
}

export class ReactionCollectorCartData extends ReactionCollectorData {
    destination!: number;
    price!: number;
}

export class ReactionCollectorCart extends ReactionCollector {
    private readonly destination: number;
    private readonly price: number;

    constructor(destination: number, price: number) {
        super();
        this.destination = destination;
        this.price = price;
    }

    creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
        return {
            id,
            endTime,
            reactions: [
                this.buildReaction(ReactionCollectorCartValidate, {}),
                this.buildReaction(ReactionCollectorCartRefuse, {}),
            ],
            data: this.buildData(ReactionCollectorCartData, {
                destination: this.destination,
                price: this.price
            })
        };
    }
}