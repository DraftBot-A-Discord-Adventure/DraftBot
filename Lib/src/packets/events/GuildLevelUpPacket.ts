import {
	DraftBotPacket, PacketDirection, sendablePacket
} from "../DraftBotPacket";

@sendablePacket(PacketDirection.BACK_TO_FRONT)
export class GuildLevelUpPacket extends DraftBotPacket {
	guildName!: string;

	level!: number;
}
