import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {
	CommandPetSellPacketReq,
	CommandPetSellSuccessPacket
} from "../../../../Lib/src/packets/commands/CommandPetSellPacket";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {SlashCommandBuilder} from "@discordjs/builders";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import i18n from "../../translations/i18n";
import {DisplayUtils} from "../../utils/DisplayUtils";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {ReactionCollectorPetSellData} from "../../../../Lib/src/packets/interaction/ReactionCollectorPetSell";
import {handleCommandGuildDailyRewardPacket} from "../guild/GuildDailyCommand";
import {CommandGuildDailyRewardPacket} from "../../../../Lib/src/packets/commands/CommandGuildDailyPacket";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandPetSellPacketReq> {
	const price = <number>interaction.options.get("price", true).value;
	const user = interaction.options.getUser("player");

	return makePacket(CommandPetSellPacketReq, {
		askedPlayerKeycloakId: user
			? await KeycloakUtils.getKeycloakIdFromDiscordId(keycloakConfig, user.id, user.displayName) ?? undefined
			: undefined,
		price
	});
}

export async function createPetSellCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorPetSellData;

	let description = i18n.t("commands:petSell.sellDescription", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName,
		price: data.price
	});
	if (data.isGuildAtMaxLevel) {
		description += `\n\n${i18n.t("commands:petSell.maxLevelWarning", {lng: interaction.userLanguage})}`;
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(
			i18n.t("commands:petSell.sellTitle", {
				lng: interaction.userLanguage
			}),
			interaction.user
		)
		.setDescription(description)
		.addFields([{
			name: i18n.t("commands:petSell.petFieldName", {
				lng: interaction.userLanguage
			}),
			value: DisplayUtils.getOwnedPetDisplay(data.pet, interaction.userLanguage),
			inline: false
		}])
		.setFooter({text: i18n.t("commands:petSell.sellFooter", {
			lng: interaction.userLanguage
		})});

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context);
}

export async function handlePetSellSuccess(context: PacketContext, packet: CommandPetSellSuccessPacket): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;

	// Send guild XP reward
	await handleCommandGuildDailyRewardPacket(makePacket(CommandGuildDailyRewardPacket, {
		guildXp: packet.xpEarned,
		guildName: packet.guildName
	}), context, false);

	// Send pet sell success message
	await interaction.reply({
		embeds: [new DraftBotEmbed()
			.formatAuthor(
				i18n.t("commands:petSell.successTitle", {
					lng: interaction.userLanguage,
					pseudo: interaction.user.displayName
				}),
				interaction.user
			)
			.setDescription(
				i18n.t("commands:petSell.successDescription", {
					lng: interaction.userLanguage,
					pet: DisplayUtils.getPetDisplay(packet.pet.typeId, packet.pet.sex === "f", interaction.userLanguage)
				})
			)]
	});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("petSell")
		.addNumberOption(option =>
			SlashCommandBuilderGenerator.generateOption("petSell", "price", option)
				.setRequired(true))
		.addUserOption(option =>
			SlashCommandBuilderGenerator.generateOption("petSell", "player", option)
				.setRequired(false)) as SlashCommandBuilder,
	getPacket,
	mainGuildCommand: false
};