import { ICommand } from "../ICommand";
import {
	makePacket, PacketContext
} from "../../../../Lib/src/packets/DraftBotPacket";
import { DraftbotInteraction } from "../../messages/DraftbotInteraction";
import { SlashCommandBuilderGenerator } from "../SlashCommandBuilderGenerator";
import {
	CommandReportBigEventResultRes,
	CommandReportMonsterRewardRes,
	CommandReportPacketReq,
	CommandReportRefusePveFightRes,
	CommandReportTravelSummaryRes
} from "../../../../Lib/src/packets/commands/CommandReportPacket";
import { ReactionCollectorCreationPacket } from "../../../../Lib/src/packets/interaction/ReactionCollectorPacket";
import {
	ReactionCollectorBigEventData, ReactionCollectorBigEventPossibilityReaction
} from "../../../../Lib/src/packets/interaction/ReactionCollectorBigEvent";
import i18n from "../../translations/i18n";
import { KeycloakUtils } from "../../../../Lib/src/keycloak/KeycloakUtils";
import { keycloakConfig } from "../../bot/DraftBotShard";
import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, Message, parseEmoji
} from "discord.js";
import { DiscordCache } from "../../bot/DiscordCache";
import { DraftBotIcons } from "../../../../Lib/src/DraftBotIcons";
import {
	effectsErrorTextValue, sendInteractionNotForYou
} from "../../utils/ErrorUtils";
import { Constants } from "../../../../Lib/src/constants/Constants";
import { Effect } from "../../../../Lib/src/types/Effect";
import {
	millisecondsToHours, millisecondsToMinutes, minutesDisplay, printTimeBeforeDate
} from "../../../../Lib/src/utils/TimeUtils";
import { DraftBotEmbed } from "../../messages/DraftBotEmbed";
import { ReactionCollectorChooseDestinationReaction } from "../../../../Lib/src/packets/interaction/ReactionCollectorChooseDestination";
import { DiscordCollectorUtils } from "../../utils/DiscordCollectorUtils";
import { EmoteUtils } from "../../utils/EmoteUtils";
import { LANGUAGE } from "../../../../Lib/src/Language";
import { ReportConstants } from "../../../../Lib/src/constants/ReportConstants";
import { ReactionCollectorReturnTypeOrNull } from "../../packetHandlers/handlers/ReactionCollectorHandlers";
import { DiscordConstants } from "../../DiscordConstants";
import { ReactionCollectorPveFightData } from "../../../../Lib/src/packets/interaction/ReactionCollectorPveFight";
import { StringUtils } from "../../utils/StringUtils";
import { KeycloakUser } from "../../../../Lib/src/keycloak/KeycloakUser";

async function getPacket(interaction: DraftbotInteraction): Promise<CommandReportPacketReq> {
	await interaction.deferReply();
	return Promise.resolve(makePacket(CommandReportPacketReq, {}));
}

/**
 * Display the big event collector that allows the player to choose the possibility of the big event
 * @param context
 * @param packet
 */
export async function createBigEventCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorBigEventData;
	const reactions = packet.reactions.map(reaction => reaction.data) as ReactionCollectorBigEventPossibilityReaction[];

	const rows = [new ActionRowBuilder<ButtonBuilder>()];
	let eventText = `${i18n.t(`events:${data.eventId}.text`, {
		lng: context.discord?.language ?? LANGUAGE.ENGLISH,
		interpolation: { escapeValue: false }
	})}\n\n`;
	for (const possibility of reactions) {
		if (possibility.name !== ReportConstants.END_POSSIBILITY_ID) {
			const emoji = EmoteUtils.translateEmojiToDiscord(DraftBotIcons.events[data.eventId.toString()][possibility.name] as string);

			const button = new ButtonBuilder()
				.setEmoji(parseEmoji(emoji)!)
				.setCustomId(possibility.name)
				.setStyle(ButtonStyle.Secondary);

			if (rows[rows.length - 1].components.length >= DiscordConstants.MAX_BUTTONS_PER_ROW) {
				rows.push(new ActionRowBuilder<ButtonBuilder>());
			}
			rows[rows.length - 1].addComponents(button);

			const reactionText = `${emoji} ${i18n.t(`events:${data.eventId}.possibilities.${possibility.name}.text`, {
				lng: context.discord?.language ?? LANGUAGE.ENGLISH,
				interpolation: { escapeValue: false }
			})}`;
			eventText += `${reactionText}\n`;
		}
	}

	const msg = await interaction?.editReply({
		content: i18n.t("commands:report.doEvent", {
			lng: interaction?.userLanguage,
			event: eventText,
			pseudo: user.attributes.gameUsername,
			interpolation: { escapeValue: false }
		}),
		components: rows
	}) as Message;

	let responded = false; // To avoid concurrence between the button controller and reaction controller
	const respondToEvent = (possibilityName: string, buttonInteraction: ButtonInteraction | null): void => {
		if (!responded) {
			responded = true;
			DiscordCollectorUtils.sendReaction(packet, context, context.keycloakId!, buttonInteraction, reactions.findIndex(reaction => reaction.name === possibilityName));
		}
	};

	const buttonCollector = msg.createMessageComponentCollector({
		time: packet.endTime - Date.now()
	});

	const endCollector = msg.createReactionCollector({
		time: packet.endTime - Date.now(),
		filter: (reaction, user) => reaction.emoji.name === DraftBotIcons.messages.notReplied && user.id === interaction.user.id
	});

	buttonCollector.on("collect", async (buttonInteraction: ButtonInteraction) => {
		if (buttonInteraction.user.id !== context.discord?.user) {
			await sendInteractionNotForYou(buttonInteraction.user, buttonInteraction, interaction.userLanguage);
			return;
		}

		await buttonInteraction.deferReply();
		respondToEvent(buttonInteraction.customId, buttonInteraction);
	});

	endCollector.on("collect", () => {
		respondToEvent(ReportConstants.END_POSSIBILITY_ID, null);
	});

	buttonCollector.on("end", async () => {
		await msg.edit({
			components: []
		});
	});

	return [buttonCollector, endCollector];
}

/**
 * Display the result of the big event
 * @param packet
 * @param context
 */
export async function reportResult(packet: CommandReportBigEventResultRes, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;

	let result = "";
	if (packet.score) {
		result += i18n.t("commands:report.points", {
			lng: interaction.userLanguage,
			score: packet.score
		});
	}
	if (packet.money < 0) {
		result += i18n.t("commands:report.moneyLoose", {
			lng: interaction.userLanguage,
			money: -packet.money
		});
	}
	else if (packet.money > 0) {
		result += i18n.t("commands:report.money", {
			lng: interaction.userLanguage,
			money: packet.money
		});
	}
	if (packet.health < 0) {
		result += i18n.t("commands:report.healthLoose", {
			lng: interaction.userLanguage,
			health: -packet.health
		});
	}
	else if (packet.health > 0) {
		result += i18n.t("commands:report.health", {
			lng: interaction.userLanguage,
			health: packet.health
		});
	}
	if (packet.energy) {
		result += i18n.t("commands:report.energy", {
			lng: interaction.userLanguage,
			energy: packet.energy
		});
	}
	if (packet.gems) {
		result += i18n.t("commands:report.gems", {
			lng: interaction.userLanguage,
			gems: packet.gems
		});
	}
	if (packet.experience) {
		result += i18n.t("commands:report.experience", {
			lng: interaction.userLanguage,
			experience: packet.experience
		});
	}
	if (packet.effect && packet.effect.name === Effect.OCCUPIED.id) {
		result += i18n.t("commands:report.timeLost", {
			lng: interaction.userLanguage,
			timeLost: minutesDisplay(packet.effect.time)
		});
	}

	const content = i18n.t("commands:report.doPossibility", {
		lng: interaction.userLanguage,
		interpolation: { escapeValue: false },
		pseudo: user.attributes.gameUsername,
		result,
		event: i18n.t(`events:${packet.eventId}.possibilities.${packet.possibilityId}.outcomes.${packet.outcomeId}`, { lng: interaction.userLanguage }),
		emoji: EmoteUtils.translateEmojiToDiscord(packet.possibilityId === ReportConstants.END_POSSIBILITY_ID
			? DraftBotIcons.events[packet.eventId].end[packet.outcomeId]
			: DraftBotIcons.events[packet.eventId][packet.possibilityId] as string),
		alte: EmoteUtils.translateEmojiToDiscord(packet.effect && packet.effect.name !== Effect.OCCUPIED.id ? DraftBotIcons.effects[packet.effect.name] : "")
	});

	const buttonInteraction = context.discord?.buttonInteraction ? DiscordCache.getButtonInteraction(context.discord?.buttonInteraction) : null;

	if (buttonInteraction) {
		await buttonInteraction.editReply({ content });
	}
	else {
		await interaction.channel.send({ content });
	}
}

/**
 * Display the travel destination collector that allows the player to choose the destination of his next trip
 * @param context
 * @param packet
 */
export async function chooseDestinationCollector(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const lng = interaction.userLanguage;

	const embed = new DraftBotEmbed();
	embed.formatAuthor(i18n.t("commands:report.destinationTitle", {
		lng,
		pseudo: user.attributes.gameUsername
	}), interaction.user);
	embed.setDescription(`${i18n.t("commands:report.chooseDestinationIndications", { lng })}\n\n`);

	return await DiscordCollectorUtils.createChoiceListCollector(interaction, embed, packet, context, packet.reactions.map(reaction => {
		const destinationReaction = reaction.data as ReactionCollectorChooseDestinationReaction;

		// If the trip duration is hidden, the translation module is used with a 2 hours placeholder and the 2 is replaced by a ? afterward
		const duration = destinationReaction.tripDuration
			? minutesDisplay(destinationReaction.tripDuration, lng)
			: minutesDisplay(120, lng)
				.replace("2", "?");
		return `${
			EmoteUtils.translateEmojiToDiscord(DraftBotIcons.mapTypes[destinationReaction.mapTypeId])
		} ${
			i18n.t(`models:map_locations.${destinationReaction.mapId}.name`, { lng })} (${duration})`;
	}), { can: false });
}

function isCurrentlyInEffect(packet: CommandReportTravelSummaryRes, now: number): boolean {
	const effectStartTime = packet.effectEndTime && packet.effectDuration ? packet.effectEndTime - packet.effectDuration : 0;
	return !(now < effectStartTime || now > (packet.effectEndTime ?? 0));
}

/**
 * Generates a string representing the player walking from a map to another
 * @param packet
 * @param now
 * @returns
 */
function generateTravelPathString(packet: CommandReportTravelSummaryRes, now: number): string {
	// Calculate trip duration
	const tripDuration = packet.arriveTime - packet.startTime - (packet.effectDuration ?? 0);

	// Player traveled time
	let playerTravelledTime = now - packet.startTime;
	const isInEffectTime = isCurrentlyInEffect(packet, now);
	const effectStartTime = packet.effectEndTime && packet.effectDuration ? packet.effectEndTime - packet.effectDuration : 0;
	if (now > (packet.effectEndTime ?? 0)) {
		playerTravelledTime -= packet.effectDuration ?? 0;
	}
	else if (isInEffectTime) {
		playerTravelledTime -= now - effectStartTime;
	}

	const playerRemainingTravelTime = tripDuration - playerTravelledTime;

	let percentage = playerTravelledTime / tripDuration;

	const remainingHours = Math.floor(millisecondsToHours(playerRemainingTravelTime));
	let remainingMinutes = Math.floor(millisecondsToMinutes(playerRemainingTravelTime - remainingHours * 3600000));
	if (remainingMinutes === 60) {
		remainingMinutes = 59;
	}
	if (remainingMinutes === remainingHours && remainingHours === 0) {
		remainingMinutes++;
	}
	const timeRemainingString = `**[${remainingHours}h${remainingMinutes < 10 ? "0" : ""}${remainingMinutes}]**`;
	if (percentage > 1) {
		percentage = 1;
	}
	let index = Constants.REPORT.PATH_SQUARE_COUNT * percentage;

	index = Math.floor(index);

	let str = `${EmoteUtils.translateEmojiToDiscord(DraftBotIcons.mapTypes[packet.startMap.type])} `;

	for (let j = 0; j < Constants.REPORT.PATH_SQUARE_COUNT; ++j) {
		if (j === index) {
			if (!isInEffectTime) {
				str += packet.isOnBoat ? "🚢" : "🧍";
			}
			else {
				str += EmoteUtils.translateEmojiToDiscord(DraftBotIcons.effects[packet.effect!]);
			}
		}
		else {
			str += "■";
		}
		if (j === Math.floor(Constants.REPORT.PATH_SQUARE_COUNT / 2) - 1) {
			str += timeRemainingString;
		}
	}

	return `${str} ${EmoteUtils.translateEmojiToDiscord(DraftBotIcons.mapTypes[packet.endMap.type])}`;
}

/**
 * Display embed with the presentation of the monster the player will fight,
 * leaves the choice to the player to not fight immediately
 * @param context
 * @param packet
 */
export async function handleStartPveFight(context: PacketContext, packet: ReactionCollectorCreationPacket): Promise<ReactionCollectorReturnTypeOrNull> {
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	const data = packet.data.data as ReactionCollectorPveFightData;

	const msg = i18n.t("commands:report.pveEvent", {
		lng: interaction.userLanguage,
		pseudo: interaction.user.displayName,
		event: StringUtils.getRandomTranslation("commands:report.encounterMonster", interaction.userLanguage, {}),
		monsterDisplay: i18n.t("commands:report.encounterMonsterStats", {
			lng: interaction.userLanguage,
			monsterName: i18n.t(`models:monsters.${data.monster.id}.name`, { lng: interaction.userLanguage }),
			emoji: DraftBotIcons.monsters[data.monster.id],
			description: i18n.t(`models:monsters.${data.monster.id}.description`, { lng: interaction.userLanguage }),
			level: data.monster.level,
			energy: data.monster.energy,
			attack: data.monster.attack,
			defense: data.monster.defense,
			speed: data.monster.speed,
			interpolation: { escapeValue: false }
		}),
		interpolation: { escapeValue: false }
	});

	return await DiscordCollectorUtils.createAcceptRefuseCollector(interaction, msg, packet, context, {
		emojis: {
			accept: DraftBotIcons.pveFights.startFight,
			refuse: DraftBotIcons.pveFights.waitABit
		}
	});
}

/**
 * Display to the user a message when the fight against a monster has been refused
 * @param context
 * @param _packet
 */
export async function refusePveFight(_packet: CommandReportRefusePveFightRes, context: PacketContext): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}
	const buttonInteraction = DiscordCache.getButtonInteraction(context.discord!.buttonInteraction!);
	await buttonInteraction?.editReply({
		content: i18n.t("commands:report.pveFightRefused", {
			lng: originalInteraction.userLanguage,
			pseudo: originalInteraction.user.displayName
		})
	});
}

/**
 * Display to the player the things that he won after the fight
 * @param packet
 * @param context
 */
export async function displayMonsterReward(
	packet: CommandReportMonsterRewardRes,
	context: PacketContext
): Promise<void> {
	const originalInteraction = DiscordCache.getInteraction(context.discord!.interaction!);
	if (!originalInteraction) {
		return;
	}

	const {
		userLanguage,
		user,
		channel
	} = originalInteraction;
	const descriptionParts: string[] = [];

	if (packet.guildXp > 0) {
		descriptionParts.push(
			i18n.t("commands:report.monsterRewardGuildXp", {
				lng: userLanguage,
				guildXp: packet.guildXp
			})
		);
	}

	descriptionParts.push(
		i18n.t("commands:report.monsterRewardsDescription", {
			lng: userLanguage,
			money: packet.money,
			experience: packet.experience
		})
	);

	if (packet.guildPoints > 0) {
		descriptionParts.push(
			i18n.t("commands:report.monsterRewardsGuildPoints", {
				lng: userLanguage,
				guildPoints: packet.guildPoints
			})
		);
	}

	const embed = new DraftBotEmbed()
		.formatAuthor(
			i18n.t("commands:report.rewardEmbedTitle", {
				lng: userLanguage,
				pseudo: user.displayName
			}),
			user
		)
		.setDescription(descriptionParts.join("\n"));

	await channel.send({ embeds: [embed] });
}

function manageMainSummaryText({
	packet,
	interaction,
	travelEmbed
}: FieldsArguments, user: KeycloakUser, now: number): void {
	if (isCurrentlyInEffect(packet, now)) {
		const errorMessageObject = effectsErrorTextValue(user, interaction.userLanguage, true, packet.effect!, packet.effectEndTime! - now);
		travelEmbed.addFields({
			name: errorMessageObject.title,
			value: errorMessageObject.description,
			inline: false
		});
		return;
	}
	if (packet.nextStopTime > packet.arriveTime) {
		// If there is no small event before the big event, do not display anything
		travelEmbed.addFields({
			name: i18n.t("commands:report.travellingTitle", { lng: interaction.userLanguage }),
			value: i18n.t("commands:report.travellingDescriptionEndTravel", { lng: interaction.userLanguage })
		});
		return;
	}

	const timeBeforeSmallEvent = printTimeBeforeDate(packet.nextStopTime);
	travelEmbed.addFields({
		name: i18n.t("commands:report.travellingTitle", { lng: interaction.userLanguage }),
		value: packet.lastSmallEventId
			? i18n.t("commands:report.travellingDescription", {
				lng: interaction.userLanguage,
				smallEventEmoji: EmoteUtils.translateEmojiToDiscord(DraftBotIcons.smallEvents[packet.lastSmallEventId]),
				time: timeBeforeSmallEvent,
				interpolation: { escapeValue: false }
			})
			: i18n.t("commands:report.travellingDescriptionWithoutSmallEvent", {
				lng: interaction.userLanguage,
				time: timeBeforeSmallEvent,
				interpolation: { escapeValue: false }
			})
	});
}

type FieldsArguments = {
	packet: CommandReportTravelSummaryRes;
	interaction: DraftbotInteraction;
	travelEmbed: DraftBotEmbed;
};

function manageEndPathDescriptions({
	packet,
	interaction,
	travelEmbed
}: FieldsArguments): void {
	travelEmbed.addFields({
		name: i18n.t("commands:report.startPoint", { lng: interaction.userLanguage }),
		value: `${DraftBotIcons.mapTypes[packet.startMap.type]} ${i18n.t(`models:map_locations.${packet.startMap.id}.name`, { lng: interaction.userLanguage })}`,
		inline: true
	});
	travelEmbed.addFields({
		name: i18n.t("commands:report.endPoint", { lng: interaction.userLanguage }),
		value: `${DraftBotIcons.mapTypes[packet.endMap.type]} ${i18n.t(`models:map_locations.${packet.endMap.id}.name`, { lng: interaction.userLanguage })}`,
		inline: true
	});
}

/**
 * Display the travel summary (embed with the travel path in between small events)
 * @param packet
 * @param context
 */
export async function reportTravelSummary(packet: CommandReportTravelSummaryRes, context: PacketContext): Promise<void> {
	const user = (await KeycloakUtils.getUserByKeycloakId(keycloakConfig, context.keycloakId!))!;
	const interaction = DiscordCache.getInteraction(context.discord!.interaction)!;
	if (!interaction) {
		return;
	}
	const now = Date.now();
	const travelEmbed = new DraftBotEmbed();
	travelEmbed.formatAuthor(i18n.t("commands:report.travelPathTitle", { lng: interaction.userLanguage }), interaction.user);
	travelEmbed.setDescription(generateTravelPathString(packet, now));
	const fieldsArguments = {
		packet,
		interaction,
		travelEmbed
	};
	manageEndPathDescriptions(fieldsArguments);
	manageMainSummaryText(fieldsArguments, user, now);
	if (packet.energy.show) {
		travelEmbed.addFields({
			name: i18n.t("commands:report.remainingEnergyTitle", { lng: interaction.userLanguage }),
			value: `⚡ ${packet.energy.current} / ${packet.energy.max}`,
			inline: true
		});
	}
	if (packet.points.show) {
		travelEmbed.addFields({
			name: i18n.t("commands:report.collectedPointsTitle", { lng: interaction.userLanguage }),
			value: `🏅 ${packet.points.cumulated}`,
			inline: true
		});
	}
	const advices = i18n.t("advices:advices", {
		returnObjects: true,
		lng: interaction.userLanguage
	});
	travelEmbed.addFields({
		name: i18n.t("commands:report.adviceTitle", { lng: interaction.userLanguage }),
		value: advices[Math.floor(Math.random() * advices.length)],
		inline: true
	});
	await interaction.editReply({ embeds: [travelEmbed] });
}

export const commandInfo: ICommand = {
	slashCommandBuilder: SlashCommandBuilderGenerator.generateBaseCommand("report"),
	getPacket,
	mainGuildCommand: false
};
