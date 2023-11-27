import {SmallEventFuncs} from "../../data/SmallEvent";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {makePacket} from "../../../../Lib/src/packets/DraftBotPacket";
import {RandomUtils} from "../utils/RandomUtils";
import {Guilds} from "../database/game/models/Guild";
import {NumberChangeReason} from "../constants/LogsConstants";
import {SmallEventWinGuildXPPacket} from "../../../../Lib/src/packets/smallEvents/SmallEventWinGuildXPPacket";

export const smallEventFuncs: SmallEventFuncs = {
	canBeExecuted: (player) => SmallEventConstants.DEFAULT_FUNCTIONS.CAN_BE_EXECUTED.onContinent(player) && player.hasAGuild(),
	executeSmallEvent: async (response, player): Promise<void> => {
		const guild = await Guilds.getById(player.guildId);
		const xpWon = RandomUtils.draftbotRandom.integer(
			SmallEventConstants.GUILD_EXPERIENCE.MIN + guild.level,
			SmallEventConstants.GUILD_EXPERIENCE.MAX + guild.level * 2
		);
		await guild.addExperience(xpWon, response, NumberChangeReason.SMALL_EVENT);
		await guild.save();
		response.push(makePacket<SmallEventWinGuildXPPacket>({amount: xpWon}));
	}
};