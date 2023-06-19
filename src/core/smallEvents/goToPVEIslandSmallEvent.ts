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

/**
 * Manage the callback to join the boat
 */
export async function confirmationCallback(
	player: Player,
	msg: DraftBotValidateReactionMessage,
	tr: TranslationModule,
	embed: DraftBotEmbed,
	emote: string,
	price: number,
	anotherMemberOnBoat: Player = null
): Promise<void> {
	if (msg.isValidated()) {
		const missionInfo = await PlayerMissionsInfos.getOfPlayer(player.id);
		if (missionInfo.gems < price) {
			embed.setDescription(`${emote} ${tr.get("notEnoughGems")}`);
		}
		else {
			await TravelTime.removeEffect(player, NumberChangeReason.SMALL_EVENT);
			await Maps.startTravel(
				player,
				await MapLinks.getById(await Settings.PVE_ISLAND.getValue()),
				anotherMemberOnBoat ? anotherMemberOnBoat.startTravelDate.valueOf() : msg.sentMessage.createdTimestamp,
				NumberChangeReason.SMALL_EVENT
			);
			await missionInfo.addGems(-price, player.discordUserId, NumberChangeReason.SMALL_EVENT);
			await missionInfo.save();
			embed.setDescription(`${emote} ${anotherMemberOnBoat ? tr.get("endStoryAcceptWithMember") : tr.get("endStoryAccept")}`);
		}
	}
	else {
		embed.setDescription(`${emote} ${tr.get("endStoryRefuse")}`);
	}
	await msg.sentMessage.channel.send({
		embeds: [embed]
	});
	BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.PVE_ISLAND);
}

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	async canBeExecuted(player: Player): Promise<boolean> {
		return player.level >= PVEConstants.MIN_LEVEL &&
			Maps.isNearWater(player) &&
			await player.getMaxCumulativeFightPoint() - player.fightPointsLost >= 0 &&
			await PlayerSmallEvents.playerSmallEventCount(player.id, "goToPVEIsland") === 0 &&
			await LogsReadRequests.getCountPVEIslandThisWeek(player.discordUserId) < PVEConstants.TRAVEL_COST.length;
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
				confirmationCallback(player, confirmMessage, tr, new DraftBotEmbed()
					.setAuthor(confirmMessage.sentMessage.embeds[0].author), seEmbed.data.description, price, anotherMemberOnBoat[0]).then();
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