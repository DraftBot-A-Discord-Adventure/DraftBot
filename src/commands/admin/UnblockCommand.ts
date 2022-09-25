import {Entities} from "../../core/database/game/models/Entity";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {draftBotClient} from "../../core/bot";
import {Translations} from "../../core/Translations";
import {sendDirectMessage} from "../../core/utils/MessageUtils";

/**
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const idToUnblock = interaction.options.get("discordid").value as string;
	if (await Entities.getByDiscordUserId(idToUnblock) === null) {
		await interaction.reply({content: "Id unrecognized (is it a message id ?)", ephemeral: true});
		return;
	}
	const blockingReason = await BlockingUtils.getPlayerBlockingReason(idToUnblock);
	if (blockingReason.length === 0) {
		await interaction.reply({content: "Not blocked", ephemeral: true});
		return;
	}
	const unblockModule = Translations.getModule("commands.unblock", language);
	blockingReason.forEach(reason => BlockingUtils.unblockPlayer(idToUnblock, reason));
	await interaction.reply({content: "Unblocked with success", ephemeral: true});
	const user = await draftBotClient.users.fetch(idToUnblock);
	const [entity] = await Entities.getOrRegister(idToUnblock);
	if (entity.Player.dmNotification) {
		sendDirectMessage(
			user,
			unblockModule.get("title"),
			unblockModule.get("description"),
			null,
			language
		);
	}


}

const currentCommandFrenchTranslations = Translations.getModule("commands.unblock", Constants.LANGUAGE.FRENCH);
const currentCommandEnglishTranslations = Translations.getModule("commands.unblock", Constants.LANGUAGE.ENGLISH);
export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName(currentCommandEnglishTranslations.get("commandName"))
		.setNameLocalizations({
			fr: currentCommandFrenchTranslations.get("commandName")
		})
		.setDescription(currentCommandEnglishTranslations.get("commandDescription"))
		.setDescriptionLocalizations({
			fr: currentCommandFrenchTranslations.get("commandDescription")
		})
		.addStringOption(option => option.setName("discordid")
			.setDescription("The discord id of the blocked user")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};