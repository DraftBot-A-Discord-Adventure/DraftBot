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
import {FightRewardPacket} from "../../../../Lib/src/packets/fights/FightRewardPacket";
import {StringUtils} from "../../utils/StringUtils";
import {ReactionCollectorReturnType} from "../../packetHandlers/handlers/ReactionCollectorHandlers";
import {AIFightActionChoosePacket} from "../../../../Lib/src/packets/fights/AIFightActionChoosePacket";
import {OwnedPet} from "../../../../Lib/src/types/OwnedPet";
import {DisplayUtils} from "../../utils/DisplayUtils";

export async function createFightCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
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

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, embed, packet, context, {
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
 * @param lng
 * @param fighterName - Name of the fighter
 * @param fightActions - Map containing the ids and breath cost of the fighter's fight actions
 * @param opponentFightActionsCount - Number of fight actions of the opponent
 * @param pet - Pet of the fighter
 */
function addFightProfileFor(introEmbed: DraftBotEmbed, lng: Language, fighterName: string, fightActions: Array<[string, number]>, opponentFightActionsCount: number, pet?: OwnedPet): void {
	let fightActionsDisplay = fightActions.map(([actionId, breathCost]) => i18n.t("commands:fight.fightActionNameDisplay", {
		lng,
		fightActionEmote: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.fight_actions[actionId]),
		fightActionName: i18n.t(`models:fight_actions.${actionId}.name`, {
			lng,
			count: 1
		}),
		interpolation: {escapeValue: false},
		breathCost
	}))
		.join("\n");

	// Add new line to make the display aligned with the opponent
	if (opponentFightActionsCount - fightActions.length > 0) {
		fightActionsDisplay += "\n".repeat(opponentFightActionsCount - fightActions.length);
	}

	const petDisplay = pet ? `\n\n${i18n.t("commands:fight.petOf", {
		lng,
		pseudo: fighterName
	})}\n${DisplayUtils.getOwnedPetInlineDisplay(pet, lng)}` : "";

	introEmbed.addFields({
		name: "_ _",
		value: `${i18n.t("commands:fight.actionsOf", {
			lng,
			pseudo: fighterName
		})}\n${fightActionsDisplay}${petDisplay}`,
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
		i18n.t(`models:monsters.${packet.fightOpponentMonsterId}.name`, {lng: interaction.userLanguage});
	const embed = new DraftBotEmbed().formatAuthor(i18n.t("commands:fight.fightIntroTitle", {
		lng: interaction.userLanguage,
		fightInitiator: interaction.user.displayName,
		opponent: opponentDisplayName
	}), interaction.user);

	addFightProfileFor(embed, interaction.userLanguage, interaction.user.displayName, packet.fightInitiatorActions, packet.fightOpponentActions.length, packet.fightInitiatorPet);
	addFightProfileFor(embed, interaction.userLanguage, opponentDisplayName, packet.fightOpponentActions, packet.fightInitiatorActions.length, packet.fightOpponentPet);

	await buttonInteraction?.editReply({embeds: [embed]});
	await DraftbotCachedMessages.getOrCreate(interaction.id, DraftbotHistoryCachedMessage).post({content: "_ _"});
	await DraftbotCachedMessages.getOrCreate(interaction.id, DraftbotFightStatusCachedMessage).post({content: "_ _"});
	await DraftbotCachedMessages.getOrCreate(interaction.id, DraftbotActionChooseCachedMessage).post({content: "_ _"});
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


export async function handleCommandFightAIFightActionChoose(context: PacketContext, packet: AIFightActionChoosePacket): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	await DraftbotCachedMessages.getOrCreate(context.discord?.interaction, DraftbotActionChooseCachedMessage)
		.post({embeds: [new DraftBotEmbed().setDescription(i18n.t("commands:fight.actions.aiChoose", {lng: interaction.userLanguage}))]});
	await new Promise(f => setTimeout(f, packet.ms));
}

/**
 * Handle the choice of an action in a fight
 * @param packet
 * @param context
 */
export async function handleCommandFightActionChoose(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnType> {
	if (!context.discord?.interaction) {
		return null;
	}
	return await DraftbotCachedMessages.getOrCreate(context.discord?.interaction, DraftbotActionChooseCachedMessage)
		.update(packet, context) as ReactionCollectorReturnType;
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
	DraftbotCachedMessages.removeAllFromMessageId(context.discord.interaction, (cachedMessage) => {
		if (!(cachedMessage instanceof DraftbotHistoryCachedMessage)) {
			cachedMessage.delete().then();
		}
	});

	const interaction = DiscordCache.getInteraction(context.discord.interaction)!;

	// Get names of fighters
	const getDisplayName = async (keycloakId?: string, monsterId?: string): Promise<string> => (keycloakId ?
		(await KeycloakUtils.getUserByKeycloakId(keycloakConfig, keycloakId))!.attributes.gameUsername[0] :
		i18n.t(`models:monsters.${monsterId}.name`, {lng: interaction.userLanguage}));

	const winnerName = await getDisplayName(packet.winner.keycloakId, packet.winner.monsterId);
	const looserName = await getDisplayName(packet.looser.keycloakId, packet.looser.monsterId);

	// Create message description
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
		.setTitle(packet.draw
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

/**
 * Generate the fight reward field displaying money and points earned during the fight if needed
 * @param embed
 * @param interaction
 * @param packet
 * @param player1Username
 */
function generateFightRewardField(embed: DraftBotEmbed, interaction: DraftbotInteraction, packet: FightRewardPacket, player1Username: string): void {
	embed.addFields({
		name: i18n.t("commands:fight.fightReward.scoreAndMoneyField", {lng: interaction.userLanguage}),
		value: ((): string => {
			if (packet.money <= 0 && packet.points <= 0) {
				return i18n.t("commands:fight.fightReward.noReward", {
					lng: interaction.userLanguage,
					player: player1Username
				});
			}
			return [
				packet.money > 0 ? i18n.t("commands:fight.fightReward.money", {
					lng: interaction.userLanguage,
					player: player1Username,
					count: packet.money
				}) : "",
				packet.points > 0 ? i18n.t("commands:fight.fightReward.points", {
					lng: interaction.userLanguage,
					player: player1Username,
					count: packet.points
				}) : ""
			].filter(Boolean).join("\n");
		})(),
		inline: false
	});
}

/**
 * Generate the glory changes field displaying glory changes for both players (glory won or lost)
 * @param embed
 * @param interaction
 * @param player1Username
 * @param packet
 * @param player2Username
 */
function generateGloryChangesField(embed: DraftBotEmbed, interaction: DraftbotInteraction, player1Username: string, packet: FightRewardPacket, player2Username: string): void {
	embed.addFields({
		name: i18n.t("commands:fight.fightReward.gloryField", {lng: interaction.userLanguage}),
		value: [
			...[
				{player: player1Username, change: packet.player1.newGlory - packet.player1.oldGlory},
				{player: player2Username, change: packet.player2.newGlory - packet.player2.oldGlory}
			].map(({player, change}) =>
				i18n.t(`commands:fight.fightReward.glory${change >= 0 ? "Positive" : "Negative"}`, {
					lng: interaction.userLanguage,
					count: Math.abs(change),
					player
				}))
		].join(""),
		inline: false
	});
}

/**
 * Display league changes if needed
 * @param packet
 * @param interaction
 * @param player1Username
 * @param player2Username
 * @param embed
 */
function displayLeagueChangesIfNeeded(packet: FightRewardPacket, interaction: DraftbotInteraction, player1Username: string, player2Username: string, embed: DraftBotEmbed): void {
	const leagueChangeValue = [
		...packet.player1.newLeagueId !== packet.player1.oldLeagueId ? [
			i18n.t(`commands:fight.fightReward.leagueChange${packet.player1.newLeagueId > packet.player1.oldLeagueId ? "Up" : "Down"}`, {
				lng: interaction.userLanguage,
				player: player1Username,
				oldLeagueEmoji: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.leagues[packet.player1.oldLeagueId]),
				newLeagueEmoji: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.leagues[packet.player1.newLeagueId]),
				oldLeague: i18n.t(`models:leagues.${packet.player1.oldLeagueId}`, {lng: interaction.userLanguage}),
				newLeague: i18n.t(`models:leagues.${packet.player1.newLeagueId}`, {lng: interaction.userLanguage})
			})
		] : [],
		...packet.player2.newLeagueId !== packet.player2.oldLeagueId ? [
			i18n.t(`commands:fight.fightReward.leagueChange${packet.player2.newLeagueId > packet.player2.oldLeagueId ? "Up" : "Down"}`, {
				lng: interaction.userLanguage,
				player: player2Username,
				oldLeagueEmoji: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.leagues[packet.player2.oldLeagueId]),
				newLeagueEmoji: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.leagues[packet.player2.newLeagueId]),
				oldLeague: i18n.t(`models:leagues.${packet.player2.oldLeagueId}`, {lng: interaction.userLanguage}),
				newLeague: i18n.t(`models:leagues.${packet.player2.newLeagueId}`, {lng: interaction.userLanguage})
			})
		] : []
	];
	if (leagueChangeValue.length > 0) {
		embed.addFields({
			name: i18n.t("commands:fight.fightReward.leagueField", {lng: interaction.userLanguage}),
			value: leagueChangeValue.join("\n"),
			inline: false
		});
	}
}

/**
 * Generate a short sentence about the fight result
 * @param packet
 * @param embed
 * @param interaction
 * @param player1Username
 * @param player2Username
 */
function generateFightRecapDescription(packet: FightRewardPacket, embed: DraftBotEmbed, interaction: DraftbotInteraction, player1Username: string, player2Username: string): void {
	const player1Won = packet.player1.newGlory > packet.player1.oldGlory;
	const player2Won = packet.player2.newGlory > packet.player2.oldGlory;
	const gloryDifference = Math.abs(packet.player1.oldGlory - packet.player2.oldGlory);
	if (gloryDifference < FightConstants.ELO.ELO_DIFFERENCE_FOR_SAME_ELO) {
		embed.setDescription(StringUtils.getRandomTranslation("commands:fight.fightReward.sameElo", interaction.userLanguage, {
			player1: player1Username,
			player2: player2Username
		}));
	}
	else if (player1Won && packet.player1.oldGlory > packet.player2.oldGlory) {
		embed.setDescription(StringUtils.getRandomTranslation("commands:fight.fightReward.higherEloWins", interaction.userLanguage, {
			winner: player1Username,
			loser: player2Username
		}));
	}
	else if (player2Won && packet.player2.oldGlory > packet.player1.oldGlory) {
		embed.setDescription(StringUtils.getRandomTranslation("commands:fight.fightReward.higherEloWins", interaction.userLanguage, {
			winner: player2Username,
			loser: player1Username
		}));
	}
	else if (player1Won && packet.player1.oldGlory < packet.player2.oldGlory) {
		embed.setDescription(StringUtils.getRandomTranslation("commands:fight.fightReward.lowestEloWins", interaction.userLanguage, {
			winner: player1Username,
			loser: player2Username
		}));
	}
	else if (player2Won && packet.player2.oldGlory < packet.player1.oldGlory) {
		embed.setDescription(StringUtils.getRandomTranslation("commands:fight.fightReward.lowestEloWins", interaction.userLanguage, {
			winner: player2Username,
			loser: player1Username
		}));
	}
	else {
		embed.setDescription(StringUtils.getRandomTranslation("commands:fight.fightReward.draw", interaction.userLanguage, {
			player1: player1Username,
			player2: player2Username
		}));
	}
}

/**
 * Handle glory and league changes
 * @param context
 * @param packet
 */
export async function handleFightReward(context: PacketContext, packet: FightRewardPacket): Promise<void> {
	if (!context.discord?.interaction) {
		return;
	}

	const interaction = DiscordCache.getInteraction(context.discord.interaction)!;

	// Get usernames for both players
	const player1Username = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.player1.keycloakId))?.attributes.gameUsername[0] || "Unknown";
	const player2Username = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, packet.player2.keycloakId))?.attributes.gameUsername[0] || "Unknown";

	// Create an embed to show glory and league changes
	const embed = new DraftBotEmbed()
		.setTitle(i18n.t("commands:fight.fightReward.title", {
			lng: interaction.userLanguage
		}));

	// Add fight reward description
	generateFightRewardField(embed, interaction, packet, player1Username);

	// Add glory changes
	generateGloryChangesField(embed, interaction, player1Username, packet, player2Username);

	// Add league changes
	displayLeagueChangesIfNeeded(packet, interaction, player1Username, player2Username, embed);

	// Generate a short sentence about the fight result
	generateFightRecapDescription(packet, embed, interaction, player1Username, player2Username);

	await interaction.channel?.send({embeds: [embed]});
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