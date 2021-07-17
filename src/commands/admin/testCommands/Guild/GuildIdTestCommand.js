module.exports.commandInfo = {
	name: "guildid",
	aliases: ["gid", "mygid"],
	commandFormat: "",
	messageWhenExecuted: "Votre guilde ({gName}) possède l'id n°{idGuild} !",
	description: "Renvoie l'id de votre guilde"
};

/**
 * Get your guild's id
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @return {String} - The successful message formatted
 */
const guildIdTestCommand = async (language, message) => {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const guild = await Guilds.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur mygid : vous n'êtes pas dans une guilde !");
	}
	return format(module.exports.commandInfo.messageWhenExecuted, {gName: guild.name, idGuild: guild.id});
};

module.exports.execute = guildIdTestCommand;