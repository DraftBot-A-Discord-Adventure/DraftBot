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
import {CommandFightPacketReq} from "../../../../Lib/src/packets/commands/CommandFightPacket";
import {ReactionCollectorFightData} from "../../../../Lib/src/packets/interaction/ReactionCollectorFight";
import {KeycloakUser} from "../../../../Lib/src/keycloak/KeycloakUser";
import {RandomUtils} from "../../../../Lib/src/utils/RandomUtils";
import {FightConstants} from "../../../../Lib/src/constants/FightConstants";
import {Language} from "../../../../Lib/src/Language";
import {KeycloakUtils} from "../../../../Lib/src/keycloak/KeycloakUtils";
import {keycloakConfig} from "../../bot/DraftBotShard";
import {DraftbotFightStatusCachedMessage} from "../../messages/DraftbotFightStatusCachedMessage";
import {DraftbotCachedMessages} from "../../messages/DraftbotCachedMessage";
import {CommandFightIntroduceFightersPacket} from "../../../../Lib/src/packets/fights/FightIntroductionPacket";
import {CommandFightStatusPacket} from "../../../../Lib/src/packets/fights/FightStatusPacket";
import {CommandFightHistoryItemPacket} from "../../../../Lib/src/packets/fights/FightHistoryItemPacket";
import {DraftbotHistoryCachedMessage} from "../../messages/DraftbotHistoryCachedMessage";
import {DraftbotActionChooseCachedMessage} from "../../messages/DraftbotActionChooseCachedMessage";
import {CommandFightEndOfFightPacket} from "../../../../Lib/src/packets/fights/EndOfFightPacket";
import {millisecondsToMinutes, minutesDisplay} from "../../../../Lib/src/utils/TimeUtils";

export async function createFightCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await interaction.deferReply();
	const data = packet.data.data as ReactionCollectorFightData;
	const subTextKey = RandomUtils.draftbotRandom.bool(FightConstants.RARE_SUB_TEXT_INTRO) ? "rare" : "common";
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

export async function handleCommandFightRefusePacketRes(context: PacketContext): Promise<void> {
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

/**
 * Add the fight action field to the intro embed of the fight for one fighter
 * @param introEmbed - Embed of the fight intro
 * @param language
 * @param fighterName - Name of the fighter
 * @param fightActions - Map containing the ids and breath cost of the fighter's fight actions
 */
function addFightActionFieldFor(introEmbed: DraftBotEmbed, language: Language, fighterName: string, fightActions: Array<[string, number]>): void {
	const fightActionsDisplay = fightActions.map(([actionId, breathCost]) => i18n.t("commands:fight.fightActionNameDisplay", {
		lng: language,
		fightActionEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_actions[actionId]),
		fightActionName: i18n.t(`models:fight_actions.${actionId}.name`, {
			lng: language,
			count: 1
		}),
		breathCost
	}))
		.join("\n");

	introEmbed.addFields({
		name: i18n.t("commands:fight.actionsOf", {
			lng: language,
			pseudo: fighterName
		}),
		value: fightActionsDisplay,
		inline: true
	});
}

/**
 * Send the fight intro message that introduces the fighters
 * @param context
 * @param packet
 */
export async function handleCommandFightIntroduceFightersRes(context: PacketContext, packet: CommandFightIntroduceFightersPacket): Promise<void> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	const opponentDisplayName = packet.fightOpponentKeycloakId ?
		(await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.fightOpponentKeycloakId))!.attributes.gameUsername[0] :
		i18n.t(`models:monster.${packet.fightOpponentMonsterId}`, {lng: interaction.userLanguage});
	// Todo: crash if both fightOpponentKeycloakId and fightOpponentMonsterId are null
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:fight.fightIntroTitle", {
		lng: interaction.userLanguage,
		fightInitiator: interaction.user.displayName,
		opponent: opponentDisplayName
	}), interaction.user);
	addFightActionFieldFor(embed, interaction.userLanguage, interaction.user.displayName, packet.fightInitiatorActions);
	addFightActionFieldFor(embed, interaction.userLanguage, opponentDisplayName, packet.fightOpponentActions);
	await buttonInteraction?.editReply({embeds: [embed]});
	await DraftbotCachedMessages.getOrCreate(interaction.id, DraftbotHistoryCachedMessage).post({content: "_ _"});
}

/**
 * Update the fight status message with the current statuses of the fighters
 * @param context
 * @param packet
 */
export async function handleCommandFightUpdateStatusRes(context: PacketContext, packet: CommandFightStatusPacket): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}
	await DraftbotCachedMessages.getOrCreate(context.discord?.interaction, DraftbotFightStatusCachedMessage)
		.update(packet, context);
}

/**
 * Update the fight history with the last action
 * @param context
 * @param packet
 */
export async function handleCommandFightHistoryItemRes(context: PacketContext, packet: CommandFightHistoryItemPacket): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}
	await DraftbotCachedMessages.getOrCreate(context.discord?.interaction, DraftbotHistoryCachedMessage)
		.update(packet, context);
}


export async function handleCommandFightAIFightActionChoose(context: PacketContext): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await DraftbotCachedMessages.getOrCreate(context.discord?.interaction, DraftbotActionChooseCachedMessage)
		.post({embeds: [new DraftBotEmbed().setDescription(i18n.t("commands:fight.actions.aiChoose", {lng: interaction.userLanguage}))]});
}

/**
 * Handle the choice of an action in a fight
 * @param packet
 * @param context
 */
export async function handleCommandFightActionChoose(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}
	await DraftbotCachedMessages.getOrCreate(context.discord?.interaction, DraftbotActionChooseCachedMessage)
		.update(packet, context);
}

/**
 * Handle the end of a fight
 * @param context
 * @param packet
 */
export async function handleEndOfFight(context: PacketContext, packet: CommandFightEndOfFightPacket): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}

	// Erase all cached messages
	DraftbotCachedMessages.removeAllFromMessageId(context.discord.interaction);

	const interaction = DiscordCache.getInteraction(context.discord.interaction)!;

	// Get names of fighters
	const getDisplayName = async (keycloakId?: string, monsterId?: string): Promise<string> => (keycloakId ?
		(await KeycloakUtils.getUserByKeycloakId(keycloakConfig, keycloakId))!.attributes.gameUsername[0] :
		i18n.t(`models:monster.${monsterId}`, {lng: interaction.userLanguage}));

	const winnerName = await getDisplayName(packet.winner.keycloakId, packet.winner.monsterId);
	const looserName = await getDisplayName(packet.looser.keycloakId, packet.looser.monsterId);

	// Create message description
	const isDraw = packet.winner.finalEnergy <= 0 && packet.looser.finalEnergy <= 0;

	let description = i18n.t("commands:fight.end.gameStats", {
		lng: interaction.userLanguage,
		turn: packet.turns,
		maxTurn: packet.maxTurns,
		time: minutesDisplay(millisecondsToMinutes(new Date().valueOf() - interaction.createdTimestamp)),
		interpolation: {escapeValue: false}
	});

	// Add fighter statistics for both fighters
	[
		{name: winnerName, stats: packet.winner},
		{name: looserName, stats: packet.looser}
	].forEach(fighter => {
		description += i18n.t("commands:fight.end.fighterStats", {
			lng: interaction.userLanguage,
			pseudo: fighter.name,
			energy: fighter.stats.finalEnergy,
			maxEnergy: fighter.stats.maxEnergy
		});
	});

	// Send embed with handshake reaction
	const embed = new DraftBotEmbed()
		.setTitle(isDraw
			? i18n.t("commands:fight.end.draw", {
				lng: interaction.userLanguage,
				player1: winnerName,
				player2: looserName
			})
			: i18n.t("commands:fight.end.win", {
				lng: interaction.userLanguage,
				winner: winnerName,
				loser: looserName
			}))
		.setDescription(description);

	const message = await interaction.channel?.send({embeds: [embed]});
	await message?.react(EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_command.handshake));
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