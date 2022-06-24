import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Entity} from "../../core/models/Entity";
import {Guild, Guilds} from "../../core/models/Guild";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {replyErrorMessage, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {BlockingConstants} from "../../core/constants/BlockingConstants";

/**
 * @param entity
 * @param guild
 * @param guildElderRemoveModule
 * @param interaction
 */
function getEndCallbackElderRemoveValidation(entity: Entity, guild: Guild, guildElderRemoveModule: TranslationModule, interaction: CommandInteraction) {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.GUILD_ELDER_REMOVE);
		if (msg.isValidated()) {
			guild.elderId = null;
			await Promise.all([guild.save()]);

			const confirmEmbed = new DraftBotEmbed()
				.setAuthor(
					guildElderRemoveModule.get("successElderRemoveTitle"),
					interaction.user.displayAvatarURL()
				)
				.setDescription(
					guildElderRemoveModule.get("successElderRemove")
				);
			interaction.followUp({embeds: [confirmEmbed]});
			return;
		}
		// Cancel the creation
		sendErrorMessage(interaction.user, interaction, guildElderRemoveModule.language, guildElderRemoveModule.get("elderRemoveCancelled"), true);
	};
}

/**
 * remove guild elder
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	const guild = await Guilds.getById(entity.Player.guildId);
	const guildElderRemoveModule = Translations.getModule("commands.guildElderRemove", language);

	if (guild.elderId === null) {
		// trying to remove an elder that does not exist
		replyErrorMessage(
			interaction,
			language,
			guildElderRemoveModule.get("noElderToRemove")
		);
		return;
	}

	await new DraftBotValidateReactionMessage(interaction.user, getEndCallbackElderRemoveValidation(entity, guild, guildElderRemoveModule, interaction))
		.formatAuthor(guildElderRemoveModule.get("elderRemoveTitle"), interaction.user)
		.setDescription(
			guildElderRemoveModule.format("elderRemove",
				{
					guildName: guild.name
				}
			)
		)
		.reply(
			interaction,
			(collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.GUILD_ELDER_REMOVE, collector)
		);
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildelderremove")
		.setDescription("Remove the elder of your guild"),
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildRequired: true,
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.CHIEF
	},
	mainGuildCommand: false
};