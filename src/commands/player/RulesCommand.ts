import {Message} from "discord.js";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";

module.exports.commandInfo = {
	name: "rules",
	aliases: ["rule"]
};

/**
 * Allows to see the rules defined by the bot owner.
 * @param {module:"discord.js".Message} message - Message from the discord server
 * @param {("fr"|"en")} language - Language to use in the response
 * @param {String[]} args=[] - Additional arguments sent with the command
 */

const RulesCommand = async (message: Message, language: string) => {
	const rules = Translations.getModule("commands.rules", language);
	const rulesEmbed = new DraftBotEmbed()
		.setTitle(rules.get("title"))
		.setFooter(rules.get("footer"))
	for (let i = 0; i < rules.getArrayLength("fieldNames"); i++){
		rulesEmbed.addFields(
			{
				name: rules.getFromArray("fieldNames", i),
				value: rules.getFromArray("fieldValues", i)
			}
		)
	};
	await message.channel.send({ embeds: [rulesEmbed] });
};

module.exports.execute = RulesCommand;