import {Message} from "discord.js";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Translations} from "../../core/Translations";

module.exports.commandInfo = {
	name: "rules",
	aliases: ["rule"]
};

const RulesCommand = async (message: Message, language: string) => {
	const rules = Translations.getModule("commands.rules", language);
	const rulesEmbed = new DraftBotEmbed()
		.setTitle(rules.get("title"))
		.setFooter(rules.get("footer"));
	for (let i = 0; i < rules.getArrayLength("fieldNames"); i++) {
		rulesEmbed.addFields(
			{
				name: rules.getFromArray("fieldNames", i),
				value: rules.getFromArray("fieldValues", i)
			}
		);
	}
	await message.channel.send({ embeds: [rulesEmbed] });
};

module.exports.execute = RulesCommand;