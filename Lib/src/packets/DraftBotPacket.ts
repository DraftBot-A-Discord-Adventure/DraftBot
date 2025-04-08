import "../index"; // Import so it will verify decorators if we use DraftBotPacket
import { Language } from "../Language";
import { RightGroup } from "../types/RightGroup";

const AllPackets = new Map<string, PacketDirection>();

export enum PacketDirection {
	NONE,
	FRONT_TO_BACK,
	BACK_TO_FRONT
}

export function sendablePacket(direction: PacketDirection) {
	/*
	 * This decorator applies onto any packet (which looks like classes, and so functions) so disabling
	 * the unsafe function type is okay, as it's only called during bot initialisation
	 */
	// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
	return function(constructor: Function): void {
		AllPackets.set(constructor.name, direction);
	};
}

export class DraftBotPacket {
}

export interface PacketContext {
	frontEndOrigin: string;

	frontEndSubOrigin: string;

	keycloakId?: string;

	discord?: {
		user: string;
		interaction: string;
		buttonInteraction?: string;
		stringSelectMenuInteraction?: string;
		channel: string;
		language: Language;
		shardId: number;
	};

	rightGroups?: RightGroup[];
}

export interface PacketLike<Packet extends DraftBotPacket> {
	new(): Packet;
}


export function makePacket<Packet extends DraftBotPacket>(PacketObject: PacketLike<Packet>, { ...args }: Packet): Packet {
	const instance = new PacketObject();
	Object.assign(instance, args);
	return instance;
}
