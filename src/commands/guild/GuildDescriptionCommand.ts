import {CommandInteraction} from "discord.js";
import {Entity} from "../../core/models/Entity";
import {sendErrorMessage} from "../../core/utils/ErrorUtils";
import Guild, {Guilds} from "../../core/models/Guild";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {Constants} from "../../core/Constants";
import {checkNameString} from "../../core/utils/StringUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {Data, DataModule} from "../../core/Data";
import {BlockingUtils} from "../../core/utils/BlockingUtils";

type InformationModules = { guildDescriptionModule: TranslationModule, guildDescriptionData: DataModule }

/**
 * Create validation message to change guild description
 * @param entity
 * @param guild
 * @param askedDescription - New description asked by the user
 * @param interaction - Discord Object
 * @param language - Language of the bot
 * @param informationModules - information module
 */
function endCallbackGuildCreateValidationMessage(
	entity: Entity,
	guild: Guild,
	askedDescription: string,
	interaction: CommandInteraction,
	language: string,
	informationModules: InformationModules): (validateMessage: DraftBotValidateReactionMessage) => void {
	return async (validateMessage: DraftBotValidateReactionMessage) => {
		if (validateMessage.isValidated()) {
			guild.guildDescription = askedDescription;
			await Promise.all([
				entity.save(),
				entity.Player.save(),
				guild.save()
			]);

			interaction.followUp({
				embeds: [new DraftBotEmbed()
					.formatAuthor(informationModules.guildDescriptionModule.get("changeDescriptionTitle"), interaction.user)
					.setDescription(informationModules.guildDescriptionModule.format("descriptionChanged", {}))]
			});
			return;
		}

		// Cancel the creation
		sendErrorMessage(interaction.user, interaction.channel, language, informationModules.guildDescriptionModule.get("editCancelled"), true);
	};
}

/**
 * Create validation message to change guild description
 * @param interaction
 * @param endCallback - Function called when user respond to validation message
 * @param askedDescription - The description asked by the user
 * @param entity
 * @param informationsModule - information modules
 */
async function createValidationEmbedGuildDesc(
	interaction: CommandInteraction,
	endCallback: (validateMessage: DraftBotValidateReactionMessage) => void,
	askedDescription: string,
	entity: Entity,
	informationsModule: InformationModules
) {
	const validationMessage = new DraftBotValidateReactionMessage(interaction.user, endCallback)
		.formatAuthor(informationsModule.guildDescriptionModule.get("changeDescriptionTitle"), interaction.user)
		.setDescription(
			informationsModule.guildDescriptionModule.format("changeDescriptionConfirm",
				{
					description: askedDescription
				}
			))
		.setFooter(informationsModule.guildDescriptionModule.get("changeDescriptionFooter"), null) as DraftBotValidateReactionMessage;

	await validationMessage.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "guildDescription", collector));

}

/**
 * Change guild description
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const guild = await Guilds.getById(entity.Player.guildId);
	const guildDescriptionModule = Translations.getModule("commands.guildDescription", language);
	const guildDescriptionData = Data.getModule("commands.guildDescription");

	const guildDescription = interaction.options.getString("description");

	if (!checkNameString(guildDescription, Constants.GUILD.MIN_DESCRIPTION_LENGTH, Constants.GUILD.MAX_DESCRIPTION_LENGTH)) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildDescriptionModule.format("invalidDescription", {
				min: Constants.GUILD.MIN_DESCRIPTION_LENGTH,
				max: Constants.GUILD.MAX_DESCRIPTION_LENGTH
			}),
			false,
			interaction
		);
	}

	const endCallback = endCallbackGuildCreateValidationMessage(entity, guild, guildDescription, interaction, language, {
		guildDescriptionModule,
		guildDescriptionData
	});

	await createValidationEmbedGuildDesc(interaction, endCallback, guildDescription, entity, {
		guildDescriptionModule,
		guildDescriptionData
	});

}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guilddesc")
		.setDescription("Change guild description")
		.addStringOption(option => option.setName("description")
			.setDescription("The new description")
			.setRequired(true)) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		allowEffects: null,
		requiredLevel: null,
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: 2,
		guildRequired: true,
		userPermission: null
	},
	mainGuildCommand: false,
	slashCommandPermissions: null
};