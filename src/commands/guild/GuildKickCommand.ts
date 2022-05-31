import {Entities, Entity} from "../../core/models/Entity";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import {Guilds} from "../../core/models/Guild";
import {MissionsController} from "../../core/missions/MissionsController";
import {BlockingUtils} from "../../core/utils/BlockingUtils";
import {ICommand} from "../ICommand";
import {Constants} from "../../core/Constants";
import {CommandInteraction} from "discord.js";
import {SlashCommandBuilder} from "@discordjs/builders";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {Translations} from "../../core/Translations";

/**
 * Allow to kick a member from a guild
 * @param interaction
 * @param {("fr"|"en")} language - Language to use in the response
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const guildKickModule = Translations.getModule("commands.guildKick", language);
	let kickedEntity = await Entities.getByOptions(interaction);
	const guild = await Guilds.getById(entity.Player.guildId);
	if (kickedEntity === null) {
		// no user provided
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildKickModule.get("cannotGetKickedUser"),
			false,
			interaction
		);
		return;
	}
	let kickedGuild;
	// search for a user's guild
	try {
		kickedGuild = await Guilds.getById(kickedEntity.Player.guildId);
	}
	catch (error) {
		kickedGuild = null;
	}

	if (kickedGuild === null || kickedGuild.id !== guild.id) {
		// not the same guild
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildKickModule.get("notInTheGuild"),
			false,
			interaction
		);
		return;
	}

	if (kickedEntity.id === entity.id) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildKickModule.get("excludeHimself"),
			false,
			interaction
		);
		return;
	}

	const endCallback = async (validateMessage: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(entity.discordUserId);
		if (validateMessage.isValidated()) {
			try {
				kickedEntity = await Entities.getByOptions(interaction);
				kickedGuild = await Guilds.getById(kickedEntity.Player.guildId);
			}
			catch (error) {
				kickedEntity = null;
				kickedGuild = null;
			}

			if (kickedGuild === null || kickedEntity === null) {
				// not the same guild
				sendErrorMessage(
					interaction.user,
					interaction.channel,
					language,
					guildKickModule.get("notInTheGuild")
				);
				return;
			}
			kickedEntity.Player.guildId = null;
			if (guild.elderId === kickedEntity.id) {
				guild.elderId = null;
			}

			await Promise.all([guild.save(), kickedEntity.save(), kickedEntity.Player.save()]);

			const embed = new DraftBotEmbed();
			embed.setAuthor(guildKickModule.format("successTitle", {
				kickedPseudo: await kickedEntity.Player.getPseudo(language),
				guildName: guild.name
			}));
			embed.setDescription(guildKickModule.get("kickSuccess"));
			await MissionsController.update(kickedEntity.discordUserId, interaction.channel, language, "guildLevel", 0, null, true);
			interaction.followUp({embeds: [embed]});
			return;
		}

		// Cancel the kick
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildKickModule.format("kickCancelled", {kickedPseudo: await kickedEntity.Player.getPseudo(language)}),
			true);
	};
	const validationEmbed = await new DraftBotValidateReactionMessage(
		interaction.user,
		endCallback
	)
		.formatAuthor(guildKickModule.get("kickTitle"), interaction.user)
		.setDescription(guildKickModule.format("kick", {
			guildName: guild.name,
			kickedPseudo: await kickedEntity.Player.getPseudo(language)
		})) as DraftBotValidateReactionMessage;
	await validationEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "guildKick", collector));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildkick")
		.setDescription("Kick someone of your guild")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to kick of your guild")
			.setRequired(false)
		)
		.addNumberOption(option => option.setName("rank")
			.setDescription("The rank of the player you want to kick of your guild")
			.setRequired(false)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildRequired: true,
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.CHIEF
	},
	mainGuildCommand: false
};