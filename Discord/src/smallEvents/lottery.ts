import {
	ReactionCollectorCreationPacket, ReactionCollectorRefuseReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {getRandomSmallEventIntro} from "../packetHandlers/handlers/SmallEventsHandler";
import i18n from "../translations/i18n";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {
	ReactionCollectorLotteryEasyReaction, ReactionCollectorLotteryHardReaction, ReactionCollectorLotteryMediumReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorLottery";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, parseEmoji} from "discord.js";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import {sendInteractionNotForYou} from "../utils/ErrorUtils";

export async function lotteryCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;

	const embed = new DraftbotSmallEventEmbed(
		"lottery",
		i18n.t("smallEvents:lottery.intro", { lng: interaction.userLanguage }),
		interaction.user,
		interaction.userLanguage
	);

	const row = new ActionRowBuilder<ButtonBuilder>();

	// Create buttons
	const easyButtonId = "easy";
	const easyButton = new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.lottery.easy)!)
		.setCustomId(easyButtonId)
		.setStyle(ButtonStyle.Secondary);

	const mediumButtonId = "medium";
	const mediumButton = new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.lottery.medium)!)
		.setCustomId(mediumButtonId)
		.setStyle(ButtonStyle.Secondary);

	const hardButtonId = "hard";
	const hardButton = new ButtonBuilder()
		.setEmoji(parseEmoji(DraftBotIcons.collectors.lottery.hard)!)
		.setCustomId(hardButtonId)
		.setStyle(ButtonStyle.Secondary);

	row.addComponents(easyButton, mediumButton, hardButton);

	// Edit message
	const msg = await interaction?.editReply({
		embeds: [embed],
		components: [row]
	}) as Message;

	// Create button collector
	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	// Send an error if someone uses the collector that is not intended for them and stop if it's the owner
	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}

		buttonCollector.stop();
	});

	// Collector end
	buttonCollector.on("end", async (collected) => {
		const firstReaction = collected.first() as ButtonInteraction;
		await firstReaction.deferReply();

		if (firstReaction) {
			if (firstReaction.customId === easyButtonId) {
				DiscordCollectorUtils.sendReaction(
					packet,
					context,
					user,
					firstReaction,
					packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorLotteryEasyReaction.name)
				);
			}
			else if (firstReaction.customId === mediumButtonId) {
				DiscordCollectorUtils.sendReaction(
					packet,
					context,
					user,
					firstReaction,
					packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorLotteryMediumReaction.name)
				);
			}
			else if (firstReaction.customId === hardButtonId) {
				DiscordCollectorUtils.sendReaction(
					packet,
					context,
					user,
					firstReaction,
					packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorLotteryHardReaction.name)
				);
			}
		}
	});
}