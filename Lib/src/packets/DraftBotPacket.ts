import "../index"; // Import so it will verify decorators if we use DraftBotPacket

const AllPackets = new Map<string, PacketDirection>();

export function verifyPacketsImplementation(implementedPackets: string[], expectedDirection: PacketDirection): void {
	let error = false;

	console.log(AllPackets);
	for (const packet of AllPackets) {
		if (packet[1] === expectedDirection && !implementedPackets.includes(packet[0])) {
			console.error(`No handler found for packet: ${packet[0]}`);
			error = true;
		}
		else if (packet[1] !== expectedDirection && implementedPackets.includes(packet[0])) {
			console.error(`Handler found for a packet that is not intended for this module (wrong direction): ${packet[0]}`);
			error = true;
		}
	}

	const allPacketsNames = Array.from(AllPackets.keys());
	for (const packet of implementedPackets) {
		if (!allPacketsNames.includes(packet)) {
			console.error(`Handler found for unknown packet: ${packet}`);
			error = true;
		}
	}

	if (error) {
		process.exit(1);
	}
}

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

export class DraftBotPacket {}

export interface PacketContext {
	keycloakId?: string;

	discord?: {
		user: string,
		interaction: string,
		buttonInteraction?: string,
		channel: string,
		language: string
	}
}


export function makePacket<Packet extends DraftBotPacket>(Packet: {new(): Packet}, {...args}: Packet): Packet {
	const instance = new Packet();
	Object.assign(instance, args);
	return instance;
}