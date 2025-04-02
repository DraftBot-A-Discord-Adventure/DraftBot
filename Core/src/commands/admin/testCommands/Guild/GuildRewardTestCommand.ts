import Guild from "../../../../core/database/game/models/Guild";
import { GuildDailyConstants } from "../../../../../../Lib/src/constants/GuildDailyConstants";
import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { draftBotInstance } from "../../../../index";
import { CommandGuildDailyPacketReq } from "../../../../../../Lib/src/packets/commands/CommandGuildDailyPacket";
import {
	DraftBotPacket, makePacket, PacketContext
} from "../../../../../../Lib/src/packets/DraftBotPacket";

let stringDesc = "Force un gd avec une sortie donnée. Liste des sorties possibles : ";
Object.entries(GuildDailyConstants.REWARD_TYPES).forEach(v => stringDesc += `\n - ${v[1]}`); // eslint-disable-line no-return-assign

export const commandInfo: ITestCommand = {
	name: "guildreward",
	aliases: ["greward"],
	commandFormat: "<reward>",
	typeWaited: {
		reward: TypeKey.STRING
	},
	description: stringDesc
};

/**
 * Force a gd with a given out
 */
const guildRewardTestCommand: ExecuteTestCommandLike = async (player, args, response, context) => {
	const guild = await Guild.findOne({ where: { id: player.guildId } });
	if (!guild) {
		throw new Error("Erreur greward : vous n'êtes pas dans une guilde !");
	}

	const rewardValues = Object.values(GuildDailyConstants.REWARD_TYPES);
	if (!rewardValues.includes(args[0])) {
		throw new Error("Erreur greward : reward donné n'existe pas. Veuillez vous référer à la commande \"test help greward\" pour plus d'informations");
	}

	const packetListener = draftBotInstance.packetListener.getListener(CommandGuildDailyPacketReq.name) as
		(packet: CommandGuildDailyPacketReq, context: PacketContext, response: DraftBotPacket[], forceReward?: number) => void | Promise<void>;
	packetListener(makePacket(CommandGuildDailyPacketReq, {}), context, response);
	return `Reward ${args[0]} forcé !`;
};

commandInfo.execute = guildRewardTestCommand;
