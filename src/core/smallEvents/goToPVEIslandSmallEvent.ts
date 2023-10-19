import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TranslationModule, Translations} from "../Translations";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {PlayerSmallEvents} from "../database/game/models/PlayerSmallEvent";
import {format} from "../utils/StringFormatter";
import {DraftBotValidateReactionMessage} from "../messages/DraftBotValidateReactionMessage";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {PVEConstants} from "../constants/PVEConstants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {MapLinks} from "../database/game/models/MapLink";
import {LogsReadRequests} from "../database/logs/LogsReadRequests";
import {PlayerMissionsInfos} from "../database/game/models/PlayerMissionsInfo";
import {TravelTime} from "../maps/TravelTime";
import {Settings} from "../database/game/models/Setting";
import {MissionsController} from "../missions/MissionsController";

async function startBoatTravel(player: Player, price: number, messageData: {
	reactionMessage: DraftBotValidateReactionMessage;
	tr: TranslationModule;
	embed: DraftBotEmbed
}, emote: string, anotherMemberOnBoat: Player): Promise<boolean> {
	const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
	if (missionInfo.gems < price) {
		messageData.embed.setDescription(`${emote} ${messageData.tr.get("notEnoughGems")}`);
		return false;
	}
	await TravelTime.removeEffect(player, NumberChangeReason.SMALL_EVENT);
	await Maps.startTravel(
		player,
		await MapLinks.getById(await Settings.PVE_ISLAND.getValue()),
		anotherMemberOnBoat ? anotherMemberOnBoat.startTravelDate.valueOf() : messageData.reactionMessage.sentMessage.createdTimestamp
	);
	await missionInfo.addGems(-price, player.discordUserId, NumberChangeReason.SMALL_EVENT);
	await missionInfo.save();
	if (price === PVEConstants.TRAVEL_COST[PVEConstants.TRAVEL_COST.length - 1]) {
		await MissionsController.update(player, messageData.reactionMessage.sentMessage.channel, messageData.tr.language, {
			missionId: "wealthyPayForPVEIsland"
		});
	}
	messageData.embed.setDescription(`${emote} ${messageData.tr.get(anotherMemberOnBoat ? "endStoryAcceptWithMember" : "endStoryAccept")}`);
	return true;
}

/**
 * Manage the callback to join the boat
 */
export async function confirmationCallback(
	player: Player,
	messageData: {
		reactionMessage: DraftBotValidateReactionMessage,
		tr: TranslationModule,
		embed: DraftBotEmbed,
	},
	emote: string,
	price: number,
	anotherMemberOnBoat: Player = null
): Promise<boolean> {
	let isGoneOnIsland = false;
	if (messageData.reactionMessage.isValidated()) {
		isGoneOnIsland = await startBoatTravel(player, price, messageData, emote, anotherMemberOnBoat);
	}
	else {
		messageData.embed.setDescription(`${emote} ${messageData.tr.get("endStoryRefuse")}`);
	}
	await messageData.reactionMessage.sentMessage.channel.send({
		embeds: [messageData.embed]
	});
	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.PVE_ISLAND);
	if (isGoneOnIsland) {
		await MissionsController.update(player, messageData.reactionMessage.sentMessage.channel, messageData.tr.language, {
			missionId: "joinPVEIsland",
			set: true
		});
	}
	return isGoneOnIsland;
}

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	async canBeExecuted(player: Player): Promise<boolean> {
		return player.level >= PVEConstants.MIN_LEVEL &&
			Maps.isNearWater(player) &&
			await player.hasEnoughEnergyToJoinTheIsland() &&
			await PlayerSmallEvents.playerSmallEventCount(player.id, "goToPVEIsland") === 0 &&
			await LogsReadRequests.getCountPVEIslandThisWeek(player.discordUserId, player.guildId) < PVEConstants.TRAVEL_COST.length;
	},

	/**
	 * Execute small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.goToPVEIsland", language);
		const price = await player.getTravelCostThisWeek();
		const anotherMemberOnBoat = await Maps.getGuildMembersOnBoat(player);

		const confirmEmbed = new DraftBotValidateReactionMessage(
			interaction.user,
			(confirmMessage: DraftBotValidateReactionMessage) => {
				confirmationCallback(player, {
					reactionMessage: confirmMessage,
					embed: new DraftBotEmbed()
						.setAuthor(confirmMessage.sentMessage.embeds[0].author),
					tr
				}, seEmbed.data.description, price, anotherMemberOnBoat[0]).then();
			}
		);

		// Copy embed data
		Object.assign(confirmEmbed.data, seEmbed.data);

		confirmEmbed.setDescription(
			`${seEmbed.data.description +
			Translations.getModule("smallEventsIntros", language).getRandom("intro") +
			format(tr.getRandom("stories"), {
				priceText: price === 0 ? tr.get("priceFree") : tr.format("priceMoney", {price})
			})}\n\n${tr.format("confirm", {
				fightPoints: await player.getCumulativeFightPoint(),
				fightPointsMax: await player.getMaxCumulativeFightPoint()
			})}`
		);

		await confirmEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.PVE_ISLAND, collector));
	}
};
