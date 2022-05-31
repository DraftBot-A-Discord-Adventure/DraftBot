import {ICommand} from "../ICommand";
import {SlashCommandBuilder} from "@discordjs/builders";
import {CommandInteraction, User} from "discord.js";
import {Entities, Entity} from "../../core/models/Entity";
import {Constants} from "../../core/Constants";
import {DraftBotEmbed} from "../../core/messages/DraftBotEmbed";
import Guild, {Guilds} from "../../core/models/Guild";
import {sendBlockedErrorInteraction, sendErrorMessage} from "../../core/utils/ErrorUtils";
import {TranslationModule, Translations} from "../../core/Translations";
import {escapeUsername} from "../../core/utils/StringUtils";
import {DraftBotValidateReactionMessage} from "../../core/messages/DraftBotValidateReactionMessage";
import {BlockingUtils} from "../../core/utils/BlockingUtils";

type PersonInformation = { user: User, entity: Entity };

function getEndCallbackGuildElder(
	chief: PersonInformation,
	elder: Entity,
	guild: Guild,
	interaction: CommandInteraction,
	guildElderModule: TranslationModule): (msg: DraftBotValidateReactionMessage) => void {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(chief.entity.discordUserId);
		if (msg.isValidated()) {
			// check if the elder is still in the guild
			// TODO: MAKE THIS WORK !!!
			const elderUpdated = await Entities.getById(elder.id);
			if (elder.Player.guildId === elderUpdated.Player.guildId) {
				return sendErrorMessage(
					chief.user,
					interaction.channel,
					guildElderModule.language,
					guildElderModule.get("problemWhilePromoting"),
					true
				);
			}

			// change the elder
			guild.elderId = elder.id;

			await guild.save();

			await interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor(
							guildElderModule.format("successElderAddTitle", {
								pseudo: escapeUsername(await elder.Player.getPseudo(guildElderModule.language)),
								guildName: guild.name
							}),
							chief.user.displayAvatarURL()
						)
						.setDescription(guildElderModule.get("successElderAdd"))
				]
			});
			return;
		}

		// Cancel the creation
		return sendErrorMessage(
			chief.user,
			interaction.channel,
			guildElderModule.language,
			guildElderModule.get("elderAddCancelled"),
			true);
	};
}

/**
 * Allow to display the promote a user to become an elder
 * @param interaction
 * @param language
 * @param entity
 */
async function executeCommand(interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	if (await sendBlockedErrorInteraction(interaction, language)) {
		return;
	}
	const guildElderModule = Translations.getModule("commands.guildElder", language);
	const elderEntity = await Entities.getByOptions(interaction);
	const guild = await Guilds.getById(entity.Player.guildId);
	const elderGuild = await Guilds.getById(elderEntity.Player.guildId);

	// check if the elder is in the right guild
	if (elderGuild === null || elderGuild.id !== guild.id) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildElderModule.get("notInTheGuild"),
			false,
			interaction
		);

	}

	// chief cannot be the elder
	if (guild.chiefId === elderEntity.id) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildElderModule.get("chiefError"),
			false,
			interaction
		);
		return;
	}

	// check if the elder is already an elder
	if (elderGuild.elderId === elderEntity.id) {
		sendErrorMessage(
			interaction.user,
			interaction.channel,
			language,
			guildElderModule.get("alreadyElder"),
			false,
			interaction
		);
	}
	const chiefPersonInformation: PersonInformation = {
		user: interaction.user,
		entity: entity
	};
	const endCallback = getEndCallbackGuildElder(
		chiefPersonInformation,
		elderEntity,
		guild,
		interaction,
		guildElderModule
	);

	const elderAddEmbed = new DraftBotValidateReactionMessage(
		interaction.user, endCallback).formatAuthor(guildElderModule.get("elderAddTitle"), chiefPersonInformation.user)
		.setDescription(guildElderModule.format("elderAdd", {
			elder: escapeUsername(await elderEntity.Player.getPseudo(language)),
			guildName: guild.name
		})) as DraftBotValidateReactionMessage;

	await elderAddEmbed.reply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "guildElder", collector));
}

export const commandInfo: ICommand = {
	slashCommandBuilder: new SlashCommandBuilder()
		.setName("guildelder")
		.setDescription("Promote a member to become an elder")
		.addUserOption(option => option.setName("user")
			.setDescription("The user you want to promote")
			.setRequired(true)
		) as SlashCommandBuilder,
	executeCommand,
	requirements: {
		disallowEffects: [Constants.EFFECT.BABY, Constants.EFFECT.DEAD],
		guildPermissions: Constants.GUILD.PERMISSION_LEVEL.CHIEF,
		guildRequired: true
	},
	mainGuildCommand: false
};