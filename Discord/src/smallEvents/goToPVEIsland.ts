import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../bot/DraftBotShard";
import {DiscordCache} from "../bot/DiscordCache";
import {
	ReactionCollectorGoToPVEIslandAcceptReaction,
	ReactionCollectorGoToPVEIslandData, ReactionCollectorGoToPVEIslandRefuseReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorGoToPVEIsland";
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, parseEmoji} from "discord.js";
import i18n from "../translations/i18n";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {getRandomSmallEventIntro} from "../packetHandlers/handlers/SmallEventsHandler";
import {StringUtils} from "../utils/StringUtils";
import {sendInteractionNotForYou} from "../utils/ErrorUtils";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {
	SmallEventGoToPVEIslandAcceptPacket,
	SmallEventGoToPVEIslandRefusePacket
} from "../../../Lib/src/packets/smallEvents/SmallEventGoToPVEIslandPacket";

export async function goToPVEIslandCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorGoToPVEIslandData;

	const row = new ActionRowBuilder<ButtonBuilder>();

	const acceptCustomId = "accept";
	const buttonAccept = new ButtonBuilder()
		.setEmoji(parseEmoji("✅")!)
		.setCustomId(acceptCustomId)
		.setStyle(ButtonStyle.Secondary);
	row.addComponents(buttonAccept);

	const buttonRefuse = new ButtonBuilder()
		.setEmoji(parseEmoji("❌")!)
		.setCustomId("refuse")
		.setStyle(ButtonStyle.Secondary);
	row.addComponents(buttonRefuse);

	const msg = await interaction?.editReply({
		embeds: [new DraftbotSmallEventEmbed(
			"goToPVEIsland",
			getRandomSmallEventIntro(interaction.userLanguage)
				+ StringUtils.getRandomTranslation(
					"smallEvents:goToPVEIsland.stories",
					interaction.userLanguage,
					{
						priceText: data.price === 0
							? i18n.t("smallEvents:goToPVEIsland.priceFree", { lng: interaction.userLanguage })
							: i18n.t("smallEvents:goToPVEIsland.priceMoney", { lng: interaction.userLanguage, price: data.price })
					}
				)
			+ "\n\n"
			+ i18n.t("smallEvents:goToPVEIsland.confirm", {
				lng: interaction.userLanguage,
				fightPoints: data.energy.current,
				fightPointsMax: data.energy.max
			}),
			interaction.user,
			interaction.userLanguage
		)],
		components: [row]
	}) as Message;

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	buttonCollector.on("collect", async (i: ButtonInteraction) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}

		buttonCollector.stop();
	});
	buttonCollector.on("end", async (collected) => {
		const firstReaction = collected.first() as ButtonInteraction;
		await firstReaction.deferReply();

		if (firstReaction && firstReaction.customId === acceptCustomId) {
			DiscordCollectorUtils.sendReaction(
				packet,
				context,
				user,
				firstReaction,
				packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorGoToPVEIslandAcceptReaction.name)
			);
		}
		else {
			DiscordCollectorUtils.sendReaction(
				packet,
				context,
				user,
				firstReaction,
				packet.reactions.findIndex((reaction) => reaction.type === ReactionCollectorGoToPVEIslandRefuseReaction.name)
			);
		}
	});
}