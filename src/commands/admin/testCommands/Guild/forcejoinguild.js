module.exports.infos = {
	name: "forcejoinguild",
	aliases: ["fjg"],
	commandFormat: "<guildToJoin>",
	typeWaited: {
		guildToJoin: typeVariable.INTEGER
	},
	messageWhenExecuted: "Votre guilde est maintenant la guilde {guildToJoin} !",
	description: "Vous fait changer de guilde de force. Votre nouvelle guilde sera la guilde passée en paramètre"
};

/**
 * Set your new guild
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {String[]} args=[] - Additional arguments sent with the command
 * @return {String} - The successful message formatted
 */
async function forcejoinguild(language, message, args) {
	const [entity] = await Entities.getOrRegister(message.author.id);

	const guildToJoin = await Guilds.findOne({where: {id: args[0]}});
	if (guildToJoin === null) {
		throw new Error("Erreur forcejoinguild : pas de guilde avec cet id !");
	}

	const guildToLeave = await Guilds.findOne({where: {id: entity.Player.guildId}});
	if (guildToLeave && guildToLeave.chiefId === entity.Player.id) {
		// the chief is leaving : destroy the guild
		await Guilds.destroy({
			where: {
				id: guildToLeave.id
			}
		});
	}

	entity.Player.guildId = guildToJoin.id;

	await Promise.all([
		guildToJoin.save(),
		entity.save(),
		entity.Player.save()
	]);

	return format(module.exports.infos.messageWhenExecuted, {guildToJoin: guildToJoin.name});
}

module.exports.execute = forcejoinguild;