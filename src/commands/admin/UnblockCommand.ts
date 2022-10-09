import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {draftBotClient} from "../../core/bot";
import {Translations} from "../../core/Translations";
import {sendDirectMessage} from "../../core/utils/MessageUtils";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {Players} from "../../core/database/game/models/Player";

/**
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 */
async function executeCommand(interaction: CommandInteraction, language: string): Promise<void> {
	const idToUnblock = interaction.options.get("discordid").value as string;
	if (await Players.getByDiscordUserId(idToUnblock) === null) {
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
	const [player] = await Players.getOrRegister(idToUnblock);
	if (player.dmNotification) {
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
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand(currentCommandFrenchTranslations, currentCommandEnglishTranslations)
		.addStringOption(option => option.setName(currentCommandEnglishTranslations.get("optionIdName"))
			.setNameLocalizations({
				fr: currentCommandFrenchTranslations.get("optionIdName")
			})
			.setDescription(currentCommandEnglishTranslations.get("optionIdDescription"))
			.setDescriptionLocalizations({
				fr: currentCommandFrenchTranslations.get("optionIdDescription")
			})
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		userPermission: Constants.ROLES.USER.BOT_OWNER
	},
	mainGuildCommand: true
};