module.exports.infos = {
	name: "gxp",
	commandFormat: "<experience>",
	typeWaited: {
		experience: typeVariable.INTEGER
	},
	messageWhenExecuted: "Votre guilde a maintenant {experience} :star: !",
	description: "Mets l'expérience de votre guilde au niveau donné"
};

/**
 * Set your guild's experience to the given integer
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function gxp(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);
	const guild = await Guilds.findOne({where: {id: entity.Player.guildId}});
	if (guild === null) {
		throw new Error("Erreur gxp : vous n'êtes pas dans une guilde !");
	}
	if (args[0] < 0) {
		throw new Error("Erreur gxp : expérience de guilde invalide. Interdit de mettre de l'expérience négative !");
	}
	guild.experience = parseInt(args[0]);
	guild.save();
	return format(module.exports.infos.messageWhenExecuted, {experience: args[0]});
}

module.exports.execute = gxp;