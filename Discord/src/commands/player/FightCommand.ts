import {DraftbotInteraction} from "../../messages/DraftbotInteraction";
import i18n from "../../translations/i18n";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {ICommand} from "../ICommand";
import {SlashCommandBuilderGenerator} from "../SlashCommandBuilderGenerator";
import {ReactionCollectorCreationPacket} from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {makePacket, PacketContext} from "../../../../Lib/src/packets/DraftBotPacket";
import {DiscordCache} from "../../bot/DiscordCache";
import {DiscordCollectorUtils} from "../../utils/DiscordCollectorUtils";
import {EmoteUtils} from "../../utils/EmoteUtils";
import {DraftBotIcons} from "../../../../Lib/src/DraftBotIcons";
import {PacketUtils} from "../../utils/PacketUtils";
import {
	CommandFightPacketReq,
	CommandFightRefusePacketRes
} from "../../../../Lib/src/packets/commands/CommandFightPacket";
import {ReactionCollectorFightData} from "../../../../Lib/src/packets/interaction/ReactionCollectorFight";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";

export async function createFightCollector(packet: ReactionCollectorCreationPacket, context: PacketContext): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorFightData;
	const subTextKey = RandomUtils.draftbotRandom.bool(FightConstants.RARE_SUB_TEXT_INTRO) ? "rare" : "common"
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:fight.title", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName
	}), interaction.user)
		.setDescription(
			i18n.t("commands:fight.confirmDesc", {
				lng: interaction.userLanguage,
				pseudo: interaction.user.displayName,
				confirmSubText: i18n.t(`commands:fight.confirmSubTexts.${subTextKey}`, {
					lng: interaction.userLanguage
				}),
				glory: i18n.t("commands:fight:information.glory", {
					lng: interaction.userLanguage,
					gloryPoints: data.playerStats.fightRanking.glory
				}),
				className: i18n.t("commands:fight:information.class", {
					lng: interaction.userLanguage,
					id: data.playerStats.classId
				}),
				stats: i18n.t("commands:fight:information.stats", {
					lng: interaction.userLanguage,
					baseBreath: data.playerStats.breath.base,
					breathRegen: data.playerStats.breath.regen,
					cumulativeAttack: data.playerStats.attack,
					cumulativeDefense: data.playerStats.defense,
					cumulativeHealth: data.playerStats.energy.value,
					cumulativeSpeed: data.playerStats.speed,
					cumulativeMaxHealth: data.playerStats.energy.max,
					maxBreath: data.playerStats.breath.max
				}),
				interpolation: {escapeValue: false}
			})
		);

	await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context, {
		emojis: {
			accept: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_command.accept),
			refuse: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_command.refuse)
		}
	});
}

export async function handleCommandFightRefusePacketRes(packet: CommandFightRefusePacketRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		embeds: [
			new DraftBotEmbed().formatAuthor(i18n.t("commands:fight.canceledTitle", {
				lng: originalInteraction.userLanguage,
				pseudo: originalInteraction.user.displayName
			}), originalInteraction.user)
				.setDescription(
					i18n.t("commands:fight.canceledDesc", {
						lng: originalInteraction.userLanguage
					})
				)
				.setErrorColor()
		]
	});
}

async function getPacket(interaction: DraftbotInteraction, user: KeycloakUser): Promise<CommandFightPacketReq | null> {
	const player = await PacketUtils.prepareAskedPlayer(interaction, user);
	if (!player || !player.keycloakId) {
		return null;
	}
	return makePacket(CommandFightPacketReq, {playerKeycloakId: player.keycloakId});
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("fight"),
	getPacket,
	mainGuildCommand: false
};