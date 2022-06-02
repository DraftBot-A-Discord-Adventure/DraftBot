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
type TextInformation = { interaction: CommandInteraction, guildElderModule: TranslationModule }

/**
 * callback for the reaction collector
 * @param chief
 * @param elder
 * @param guild
 * @param textInformation
 */
function getEndCallbackGuildElder(
	chief: PersonInformation,
	elder: Entity,
	guild: Guild,
	textInformation: TextInformation): (msg: DraftBotValidateReactionMessage) => void {
	return async (msg: DraftBotValidateReactionMessage) => {
		BlockingUtils.unblockPlayer(chief.entity.discordUserId);
		if (msg.isValidated()) {
			const elderUpdated = await Entities.getById(elder.id);
			if (elder.Player.guildId !== elderUpdated.Player.guildId) {
				return sendErrorMessage(
					chief.user,
					textInformation.interaction.channel,
					textInformation.guildElderModule.language,
					textInformation.guildElderModule.get("problemWhilePromoting"),
					true
				);
			}

			// change the elder
			guild.elderId = elder.id;

			await guild.save();

			await textInformation.interaction.followUp({
				embeds: [
					new DraftBotEmbed()
						.setAuthor(
							textInformation.guildElderModule.format("successElderAddTitle", {
								pseudo: escapeUsername(await elder.Player.getPseudo(textInformation.guildElderModule.language)),
								guildName: guild.name
							}),
							chief.user.displayAvatarURL()
						)
						.setDescription(textInformation.guildElderModule.get("successElderAdd"))
				]
			});
			return;
		}

		// Cancel the creation
		return sendErrorMessage(
			chief.user,
			textInformation.interaction.channel,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("elderAddCancelled"),
			true);
	};
}

/**
 * Check if the elder is eligible
 * @param elderGuild
 * @param guild
 * @param textInformation
 * @param elderEntity
 */
function checkElderEligibility(elderGuild: Guild, guild: Guild, textInformation: TextInformation, elderEntity: Entity): boolean {
	// check if the elder is in the right guild
	if (elderGuild === null || elderGuild.id !== guild.id) {
		sendErrorMessage(
			textInformation.interaction.user,
			textInformation.interaction.channel,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("notInTheGuild"),
			false,
			textInformation.interaction
		);
		return false;
	}

	// chief cannot be the elder
	if (guild.chiefId === elderEntity.id) {
		sendErrorMessage(
			textInformation.interaction.user,
			textInformation.interaction.channel,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("chiefError"),
			false,
			textInformation.interaction
		);
		return false;
	}

	// check if the elder is already an elder
	if (elderGuild.elderId === elderEntity.id) {
		sendErrorMessage(
			textInformation.interaction.user,
			textInformation.interaction.channel,
			textInformation.guildElderModule.language,
			textInformation.guildElderModule.get("alreadyElder"),
			false,
			textInformation.interaction
		);
		return false;
	}
	return true;
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

	// check if the elder is eligible
	const eligible: boolean = checkElderEligibility(elderGuild, guild, {interaction, guildElderModule}, elderEntity);
	if (!eligible) {
		return;
	}

	const endCallback = getEndCallbackGuildElder(
		{
			user: interaction.user,
			entity: entity
		},
		elderEntity,
		guild,
		{
			interaction,
			guildElderModule
		}
	);

	const elderAddEmbed = new DraftBotValidateReactionMessage(
		interaction.user, endCallback).formatAuthor(guildElderModule.get("elderAddTitle"), interaction.user)
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