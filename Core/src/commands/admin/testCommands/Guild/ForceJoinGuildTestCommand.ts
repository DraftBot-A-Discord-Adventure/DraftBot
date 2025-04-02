import Guild from "../../../../core/database/game/models/Guild";
import {
	ExecuteTestCommandLike, ITestCommand, TypeKey
} from "../../../../core/CommandsTest";
import { Players } from "../../../../core/database/game/models/Player";
import { GuildConstants } from "../../../../../../Lib/src/constants/GuildConstants";

export const commandInfo: ITestCommand = {
	name: "forcejoinguild",
	aliases: ["fjg"],
	commandFormat: "<guildToJoin>",
	typeWaited: {
		guildToJoin: TypeKey.STRING
	},
	description: "Vous fait changer de guilde de force. Votre nouvelle guilde sera la guilde passée en paramètre"
};

/**
 * Set your new guild
 */
const forceJoinGuildTestCommand: ExecuteTestCommandLike = async (player, args) => {
	const guildToJoin = await Guild.findOne({ where: { name: args[0] } });
	if (!guildToJoin) {
		throw new Error("Erreur forcejoinguild : pas de guilde avec cet id !");
	}

	const guildToLeave = await Guild.findOne({ where: { id: player.guildId } });
	if (guildToLeave !== null && guildToLeave) {
		if (guildToJoin.id === guildToLeave.id) {
			throw new Error("Erreur forcejoinguild : vous êtes déjà dans la guilde donnée !");
		}
	}
	if ((await Players.getByGuild(guildToJoin.id)).length === GuildConstants.MAX_GUILD_MEMBERS) {
		throw new Error("Erreur forcejoinguild : nombre de joueurs maximum dans cette guilde atteint !");
	}
	if (guildToLeave && guildToLeave.chiefId === player.id) {
		// The chief is leaving : destroy the guild
		await Guild.destroy({
			where: {
				id: guildToLeave.id
			}
		});
	}

	player.guildId = guildToJoin.id;

	await Promise.all([
		guildToJoin.save(),
		player.save(),
		player.save()
	]);

	return `Votre guilde est maintenant la guilde ${guildToJoin.name} !`;
};

commandInfo.execute = forceJoinGuildTestCommand;
