import Guild from "../../../../core/database/game/models/Guild";
import {
	ExecuteTestCommandLike, ITestCommand
} from "../../../../core/CommandsTest";

export const commandInfo: ITestCommand = {
	name: "guildid",
	aliases: ["gid", "mygid"],
	description: "Renvoie l'id de votre guilde"
};

/**
 * Get your guild's id
 */
const guildIdTestCommand: ExecuteTestCommandLike = async player => {
	const guild = await Guild.findOne({ where: { id: player.guildId } });
	if (!guild) {
		throw new Error("Erreur mygid : vous n'êtes pas dans une guilde !");
	}
	return `Votre guilde (${guild.name}) possède l'id n°${guild.id} !`;
};

commandInfo.execute = guildIdTestCommand;
