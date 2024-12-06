import "../index"; // Import so it will verify decorators if we use DraftBotPacket
import {Language} from "../Language";
import {RightGroup} from "../enums/RightGroup";

const AllPackets = new Map<string, PacketDirection>();

export enum PacketDirection {
	NONE,
	FRONT_TO_BACK,
	BACK_TO_FRONT
}

export function sendablePacket(direction: PacketDirection) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function(constructor: Function): void {
		AllPackets.set(constructor.name, direction);
	};
}

export class DraftBotPacket {
}

export interface PacketContext {
	keycloakId?: string;

	discord?: {
		user: string,
		interaction: string,
		buttonInteraction?: string,
		channel: string,
		language: Language
	}

	rightGroups?: RightGroup[];
}

export interface PacketLike<Packet extends DraftBotPacket> {
	new(): Packet;
}


export function makePacket<Packet extends DraftBotPacket>(packet: PacketLike<Packet>, {...args}: Packet): Packet {
	const instance = new packet();
	Object.assign(instance, args);
	return instance;
}