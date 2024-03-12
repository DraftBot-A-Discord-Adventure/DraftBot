import {DraftBotPacket} from "../DraftBotPacket";

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
}