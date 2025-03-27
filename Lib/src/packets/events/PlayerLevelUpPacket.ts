import {DraftBotPacket, PacketDirection, sendablePacket} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class PlayerLevelUpPacket extends DraftBotPacket {
	level!: number;

	fightUnlocked!: boolean;

	guildUnlocked!: boolean;

	healthRestored!: boolean;

	classesTier1Unlocked!: boolean;

	classesTier2Unlocked!: boolean;

	classesTier3Unlocked!: boolean;

	classesTier4Unlocked!: boolean;

	classesTier5Unlocked!: boolean;

	missionSlotUnlocked!: boolean;

	pveUnlocked!: boolean;

	statsIncreased!: boolean;
}