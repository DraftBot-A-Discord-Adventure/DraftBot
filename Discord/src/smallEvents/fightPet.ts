import {ReactionCollectorCreationPacket} from "../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {PacketContext} from "../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../bot/DiscordCache";
import {DiscordCollectorUtils} from "../utils/DiscordCollectorUtils";
import {DraftbotSmallEventEmbed} from "../messages/DraftbotSmallEventEmbed";
import {StringUtils} from "../utils/StringUtils";
import {EmoteUtils} from "../utils/EmoteUtils";
import {DraftBotIcons} from "../../../Lib/src/DraftBotIcons";
import i18n from "../translations/i18n";
import {getRandomSmallEventIntro} from "../packetHandlers/handlers/SmallEventsHandler";
import {
	ReactionCollectorFightPetData,
	ReactionCollectorFightPetReaction
} from "../../../Lib/src/packets/interaction/ReactionCollectorFightPet";
import {DraftbotInteraction} from "../messages/DraftbotInteraction";
import {ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageReaction} from "discord.js";
import {sendInteractionNotForYou} from "../utils/ErrorUtils";
import {PetConstants} from "../../../Lib/src/constants/PetConstants";

type FightPetActionMenu = {
	menu: string,
	actions: [string, string][]
}

function getFightPetMenu(interaction: DraftbotInteraction, reactions: ReactionCollectorFightPetReaction[]): FightPetActionMenu {
	const result: FightPetActionMenu = {
		menu: "\n\n",
		actions: []
	};
	for (const reaction of reactions) {
		const actionId = reaction.actionId;
		const emoji = EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fightPetActions[actionId]);
		result.menu += `${emoji} ${i18n.t(`smallEvents:fightPet.fightPetActions.${actionId}.name`, {lng: interaction.userLanguage})}\n`;
		result.actions.push([actionId, emoji]);
	}
	return result;
}

export async function fightPetCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorFightPetData;
	const genre = data.isFemale ? PetConstants.SEX.MALE_FULL : PetConstants.SEX.FEMALE_FULL;

	const formatBaseOptions = {
		lng: interaction.userLanguage,
		context: genre
	};

	const menu = getFightPetMenu(interaction, packet.reactions.map(reaction => reaction.data as ReactionCollectorFightPetReaction));

	const row = new ActionRowBuilder<ButtonBuilder>();

	for (const action of menu.actions) {
		const button = new ButtonBuilder()
			.setEmoji(action[1])
			.setCustomId(action[0])
			.setStyle(ButtonStyle.Secondary);
		row.addComponents(button);
	}

	const msg = await interaction.editReply({
		components: [row],
		embeds: [
			new DraftbotSmallEventEmbed(
				"fightPet",
				`${getRandomSmallEventIntro(interaction.userLanguage)}${
					StringUtils.getRandomTranslation("smallEvents:fightPet.intro", interaction.userLanguage, {
						...formatBaseOptions,
						feralPet: i18n.t("smallEvents:fightPet.customPetDisplay", {
							...formatBaseOptions,
							petId: data.petId,
							petName: i18n.t(`models:pets.${data.petId}`, formatBaseOptions),
							adjective: StringUtils.getRandomTranslation("smallEvents:fightPet.adjectives", interaction.userLanguage, formatBaseOptions)
						})
					})} ${StringUtils.getRandomTranslation("smallEvents:fightPet.situation", interaction.userLanguage)}${menu.menu}`,
				interaction.user,
				interaction.userLanguage
			)
		]
	});

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	const reactionCollector = msg.createReactionCollector({
		filter: (reaction: MessageReaction) => reaction.me && !reaction.users.cache.has(context.discord!.user),
		time: packet.endTime - Date.now()
	});

	buttonCollector.on("collect", async (i) => {
		if (i.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(i.user, i, interaction.userLanguage);
			return;
		}
		await i.update({components: []});
		buttonCollector.stop();
	});

	reactionCollector.on("collect", (reaction) => {
		if (reaction.emoji.name === DraftBotIcons.messages.notReplied) {
			reactionCollector.stop();
			buttonCollector.stop();
		}
	});

	buttonCollector.on("end", (collected) => {
		DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, null, packet.reactions.findIndex((reaction) =>
			reaction.type === ReactionCollectorFightPetReaction.name
			&& (reaction.data as ReactionCollectorFightPetReaction).actionId === collected.first()?.customId));
	});
}