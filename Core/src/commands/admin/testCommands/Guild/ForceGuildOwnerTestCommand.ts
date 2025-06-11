import Guild from "../../../../core/database/game/models/Guild";
import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";
import { crowniclesInstance } from "../../../../index";

export const commandInfo: ITestCommand = {
	name: "forceguildowner",
	aliases: ["fgo"],
	description: "Vous passe chef de guilde de force"
};

/**
 * Force you to be the guild's chief
 */
const forceGuildOwnerTestCommand: ExecuteTestCommandLike = async player => {
	const guild = await Guild.findOne({ where: { id: player.guildId } });
	if (!guild) {
		throw new Error("Erreur forceguildowner : vous n'êtes pas dans une guilde !");
	}
	crowniclesInstance.logsDatabase.logGuildChiefChange(guild, player.id).then();
	guild.chiefId = player.id;
	await guild.save();
	return `Vous êtes maintenant chef de votre guilde (Guilde ${guild.name}) !`;
};

commandInfo.execute = forceGuildOwnerTestCommand;
