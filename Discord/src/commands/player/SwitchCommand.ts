import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {
	ActionRowBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuInteraction,
	StringSelectMenuOptionBuilder
} from "discord.js";
import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {Constants} from "../../../../Lib/src/constants/Constants";
import {sendInteractionNotForYou} from "../../utils/ErrorUtils";
import {LANGUAGE, Language} from "../../../../Lib/src/Language";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {CommandSwitchPacketReq, CommandSwitchPacketRes} from "../../../../Lib/src/packets/commands/CommandSwitchPacket";
import {DiscordCache} from "../../bot/DiscordCache";

/**
 * Switch an item from the backup inventory of the player to the main inventory
 */
function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): CommandSwitchPacketReq {
	return makePacket(CommandSwitchPacketReq, {keycloakId: user.id});
}

export async function handleCommandSwitchPacketRes(packet: CommandSwitchPacketRes, context: PacketContext): Promise<null> {
	const selectSwitchMenuId = "switchSelectionMenu";
	const interaction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!interaction) {
		return null; // The interaction does not exist or cannot be found for some reason, we cannot reply
	}
	const selectSwitchMenuOptions = [
		...packet.data.backupWeapons.map((item) => new StringSelectMenuOptionBuilder()
			.setLabel()
			.setValue(`weapon-${item.slot}`)),
		...packet.data.backupArmors.map((item) => new StringSelectMenuOptionBuilder()
			.setLabel(item.display.name)
			.setValue(`armor-${item.slot}`)),
		...packet.data.backupPotions.map((item) => new StringSelectMenuOptionBuilder()
			.setLabel(item.display.name)
			.setValue(`potion-${item.slot}`)),
		...packet.data.backupObjects.map((item) => new StringSelectMenuOptionBuilder()
			.setLabel(item.display.name)
			.setValue(`object-${item.slot}`))
	];

	const languageSelectionMenu = new StringSelectMenuBuilder()
		.setCustomId(selectSwitchMenuId)
		.setPlaceholder(i18n.t("commands:language.selectLanguage", {lng: interaction.userLanguage}))
		.addOptions(selectSwitchMenuOptions);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>()
		.addComponents(languageSelectionMenu);

	const msg = await interaction.reply({
		embeds: [new DraftBotEmbed()
			.setTitle(i18n.t("commands:language.title", {
				lng: interaction.userLanguage
			}))
			.setDescription(i18n.t("commands:language.description", {
				lng: interaction.userLanguage
			}))],
		components: [row]
	});

	const collector = msg.createMessageComponentCollector({
		filter: menuInteraction => menuInteraction.customId === selectLanguageMenuId,
		time: Constants.MESSAGES.COLLECTOR_TIME
	});

	collector.on("collect", async (menuInteraction: StringSelectMenuInteraction) => {

		if (menuInteraction.user.id !== interaction.user.id) {
			await sendInteractionNotForYou(menuInteraction.user, menuInteraction, interaction.userLanguage);
			return;
		}

		await KeycloakUtils.updateUserLanguage(keycloakConfig, keycloakUser, menuInteraction.values[0] as Language);

		await menuInteraction.reply({
			embeds: [new DraftBotEmbed()
				.setTitle(i18n.t("commands:language.newLanguageSetTitle", {
					lng: menuInteraction.values[0] as Language
				}))
				.setDescription(i18n.t("commands:language.newLanguageSetDescription", {
					lng: menuInteraction.values[0] as Language
				}))]
		});
	});
	return null;
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("language"),
	getPacket,
	requirements: {},
	mainGuildCommand: false
};
