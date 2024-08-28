import {
	ReactionCollector,
	ReactionCollectorAcceptReaction,
	ReactionCollectorCreationPacket,
	ReactionCollectorData,
	ReactionCollectorRefuseReaction
} from "./ReactionCollectorPacket";
import {MainItemDisplayPacket, SupportItemDisplayPacket} from "../../interfaces/ItemDisplayPacket";

export class ReactionCollectorSwitchData extends ReactionCollectorData {
	data!: {
		weapon: MainItemDisplayPacket,
		armor: MainItemDisplayPacket,
		potion: SupportItemDisplayPacket,
		object: SupportItemDisplayPacket,
		backupWeapons: { display: MainItemDisplayPacket, slot: number }[],
		backupArmors: { display: MainItemDisplayPacket, slot: number }[],
		backupPotions: { display: SupportItemDisplayPacket, slot: number }[],
		backupObjects: { display: SupportItemDisplayPacket, slot: number }[],
		slots: {
			weapons: number,
			armors: number,
			potions: number,
			objects: number
		}
	};
}

export class ReactionCollectorSwitch extends ReactionCollector {
	data!: {
		weapon: MainItemDisplayPacket,
		armor: MainItemDisplayPacket,
		potion: SupportItemDisplayPacket,
		object: SupportItemDisplayPacket,
		backupWeapons: { display: MainItemDisplayPacket, slot: number }[],
		backupArmors: { display: MainItemDisplayPacket, slot: number }[],
		backupPotions: { display: SupportItemDisplayPacket, slot: number }[],
		backupObjects: { display: SupportItemDisplayPacket, slot: number }[],
		slots: {
			weapons: number,
			armors: number,
			potions: number,
			objects: number
		}
	};

	constructor(data: ReactionCollectorSwitchData) {
		super();
		this.data = data.data;
	}

	creationPacket(id: string, endTime: number): ReactionCollectorCreationPacket {
		return {
			id,
			endTime,
			reactions: [

			],
			data: this.buildData(ReactionCollectorSwitchData, {
				data: this.data
			})
		};
	}
}