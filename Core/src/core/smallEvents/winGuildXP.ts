import { SmallEventFuncs } from "../../data/SmallEvent";
import { SmallEventConstants } from "../../../../Lib/src/constants/SmallEventConstants";
import { makePacket } from "../../../../Lib/src/packets/DraftBotPacket";
import { RandomUtils } from "../../../../Lib/src/utils/RandomUtils";
import { Guilds } from "../database/game/models/Guild";
import { NumberChangeReason } from "../../../../Lib/src/constants/LogsConstants";
import { SmallEventWinGuildXPPacket } from "../../../../Lib/src/packets/smallEvents/SmallEventWinGuildXPPacket";
import { Maps } from "../maps/Maps";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: player => Maps.isOnContinent(player) && player.hasAGuild(),
	executeSmallEvent: async (response, player): Promise<void> => {
		const guild = await Guilds.getById(player.guildId);
		const xpWon = RandomUtils.draftbotRandom.integer(
			SmallEventConstants.GUILD_EXPERIENCE.MIN + guild.level,
			SmallEventConstants.GUILD_EXPERIENCE.MAX + guild.level * 2
		);
		await guild.addExperience(xpWon, response, NumberChangeReason.SMALL_EVENT);
		await guild.save();
		response.push(makePacket(SmallEventWinGuildXPPacket, {
			amount: xpWon,
			guildName: guild.name
		}));
	}
};
