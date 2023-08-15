import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../Translations";
import {Data, JsonModule} from "../Data";
import {SmallEventConstants} from "../constants/SmallEventConstants";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {minutesDisplay} from "../utils/TimeUtils";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {NumberChangeReason} from "../constants/LogsConstants";
import {EffectsConstants} from "../constants/EffectsConstants";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TravelTime} from "../maps/TravelTime";
import Player from "../database/game/models/Player";
import {Constants} from "../Constants";
import {Maps} from "../maps/Maps";

type RewardType = { type: string, value: number | string };

/**
 * Generates the malus the player will outcome
 * @param player
 * @param malus
 * @param notReacted
 */
function generateMalus(player: Player, malus: string, notReacted: boolean): RewardType {
	if (notReacted) {
		return {
			type: "end",
			value: Math.round(player.level * SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.END_LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.BASE
				+ RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.VARIATION)
		};
	}

	switch (malus) {
	case "life":
		return {
			type: malus,
			value: Math.round(player.level * SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.BASE
				+ RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.HEALTH_LOST.VARIATION)
		};
	case "time":
		return {
			type: malus,
			value: Math.round(player.level * SmallEventConstants.GOBLETS_GAME.TIME_LOST.LEVEL_MULTIPLIER) + SmallEventConstants.GOBLETS_GAME.TIME_LOST.BASE
				+ RandomUtils.variationInt(SmallEventConstants.GOBLETS_GAME.TIME_LOST.VARIATION)
		};
	case "nothing":
		return {
			type: malus,
			value: 0
		};
	default:
		return null;
	}
}

/**
 * Apply the malus the player drawn
 * @param malus
 * @param interaction
 * @param language
 * @param player
 */
async function applyMalus(malus: RewardType, interaction: CommandInteraction, language: string, player: Player): Promise<void> {
	switch (malus.type) {
	case "life":
		await player.addHealth(-malus.value, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	case "time":
		await TravelTime.applyEffect(player, EffectsConstants.EMOJI_TEXT.OCCUPIED, malus.value as number, new Date(), NumberChangeReason.SMALL_EVENT);
		malus.value = minutesDisplay(malus.value as number);
		break;
	case "nothing":
		break;
	case "end":
		await player.addHealth(-malus.value, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		throw new Error("reward type not found");
	}
	await player.killIfNeeded(interaction.channel, language, NumberChangeReason.SMALL_EVENT);
	await player.save();
}

/**
 * Generates the resulting message of the (dubious) game
 * @param malus
 * @param goblet
 * @param seEmbed
 * @param tr
 */
function generateEndMessage(malus: RewardType, goblet: string, seEmbed: DraftBotEmbed, tr: TranslationModule): DraftBotEmbed {
	seEmbed.setDescription(format(tr.getRandom(`results.${malus.type}`), {
		amount: malus.value,
		goblet: goblet
	}));
	return seEmbed;
}

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnContinent(player));
	},

	/**
	 * Makes a (dubious) game of find the ball under the goblets with a stranger
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed) {
		const tr = Translations.getModule("smallEvents.gobletsGame", language);
		const data = Data.getModule("smallEvents.gobletsGame");

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.endCallback(async (chooseGobletMessage) => {
				const reaction = chooseGobletMessage.getFirstReaction();
				const reactionEmoji = !reaction ? Constants.REACTIONS.NOT_REPLIED_REACTION : reaction.emoji.name;
				const malus = generateMalus(player, data.getRandomStringFromArray("malusTypes"), !reaction);
				let currentGoblet: JsonModule;
				for (let i = 0; i < tr.getObjectSize("intro.goblets"); i++) {
					currentGoblet = tr.getObject("intro.goblets")[i];
					if (reactionEmoji === Constants.REACTIONS.NOT_REPLIED_REACTION || reactionEmoji === tr.getObject("intro.goblets")[i].emoji) {
						BlockingUtils.unblockPlayer(player.discordUserId, BlockingConstants.REASONS.GOBLET_CHOOSE);
						await applyMalus(malus, interaction, language, player);
						await chooseGobletMessage.sentMessage.channel.send({embeds: [generateEndMessage(malus, currentGoblet.name as string, seEmbed, tr)]});
						break;
					}
				}
			});

		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let goblets = "", gobletEmoji = "", currentGoblet: JsonModule;
		for (let i = 0; i < tr.getObjectSize("intro.goblets"); i++) {
			currentGoblet = tr.getObject("intro.goblets")[i];
			gobletEmoji = currentGoblet.emoji as string;
			goblets += `${gobletEmoji} ${currentGoblet.desc as string}`;
			embed.addReaction(new DraftBotReaction(gobletEmoji));
		}
		const builtEmbed = embed.build();
		builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
		builtEmbed.setDescription(
			seEmbed.data.description
			+ intro
			+ tr.getRandom("intro.intrigue")
			+ goblets
		);
		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(player.discordUserId, BlockingConstants.REASONS.GOBLET_CHOOSE, collector));
	}
};