import {CommandInteraction} from "discord.js";
import {TranslationModule, Translations} from "../Translations";
import {Data, JsonModule} from "../Data";
import {Constants} from "../Constants";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {RandomUtils} from "../utils/RandomUtils";
import {format} from "../utils/StringFormatter";
import {minutesDisplay} from "../utils/TimeUtils";
import {BlockingUtils} from "../utils/BlockingUtils";
import {BlockingConstants} from "../constants/BlockingConstants";
import {NumberChangeReason} from "../database/logs/LogsDatabase";
import Entity from "../database/game/models/Entity";
import {EffectsConstants} from "../constants/EffectsConstants";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import {TravelTime} from "../maps/TravelTime";

type RewardType = { type: string, option: number | string };

/**
 * Generates the malus the entity will outcome
 * @param entity
 * @param malus
 */
function generateMalus(entity: Entity, malus: string): RewardType {
	switch (malus) {
	case "life":
		return {
			type: malus,
			option: Math.round(entity.Player.level / 6) + Constants.SMALL_EVENT.BASE_HEALTH_LOST_GOBLETS_GAME + RandomUtils.draftbotRandom.integer(-3, 3)
		};
	case "time":
		return {
			type: malus,
			option: Math.round(entity.Player.level * 0.42) + Constants.SMALL_EVENT.BASE_TIME_LOST_GOBLETS_GAME + RandomUtils.draftbotRandom.integer(0, 10)
		};
	case "nothing":
		return {
			type: malus,
			option: 0
		};
	case "end":
		return {
			type: malus,
			option: Math.round(entity.Player.level / 8) + Constants.SMALL_EVENT.BASE_HEALTH_LOST_GOBLETS_GAME + RandomUtils.draftbotRandom.integer(-3, 3)
		};
	default:
	}
}

/**
 * Apply the malus the entity drawn
 * @param malus
 * @param interaction
 * @param language
 * @param entity
 */
async function applyMalus(malus: RewardType, interaction: CommandInteraction, language: string, entity: Entity): Promise<void> {
	switch (malus.type) {
	case "life":
		await entity.addHealth(-malus.option, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	case "time":
		await TravelTime.applyEffect(entity.Player, EffectsConstants.EMOJI_TEXT.OCCUPIED, malus.option as number, interaction.createdAt, NumberChangeReason.SMALL_EVENT);
		malus.option = minutesDisplay(malus.option as number);
		break;
	case "nothing":
		break;
	case "end":
		await entity.addHealth(-malus.option, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		throw new Error("reward type not found");
	}
	await entity.Player.killIfNeeded(entity, interaction.channel, language, NumberChangeReason.SMALL_EVENT);
	await entity.save();
	await entity.save();
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
		amount: malus.option,
		goblet: goblet
	}));
	return seEmbed;
}

export const smallEvent: SmallEvent = {
	/**
	 * No restrictions on who can do it
	 */
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	/**
	 * Makes a (dubious) game of find the ball under the goblets with a stranger
	 * @param interaction
	 * @param language
	 * @param entity
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: Entity, seEmbed: DraftBotEmbed) {
		const tr = Translations.getModule("smallEvents.gobletsGame", language);
		const data = Data.getModule("smallEvents.gobletsGame");

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(interaction.user)
			.endCallback(async (chooseGobletMessage) => {
				const reaction = chooseGobletMessage.getFirstReaction();
				const reactionEmoji = !reaction ? "🔚" : reaction.emoji.name;
				let malus = generateMalus(entity, data.getRandomStringFromArray("malusTypes"));
				if (!reaction) {
					malus = generateMalus(entity, "end");
				}
				let currentGoblet: JsonModule;
				for (let i = 0; i < tr.getObjectSize("intro.goblets"); i++) {
					currentGoblet = tr.getObject("intro.goblets")[i];
					if (reactionEmoji === "🔚" || reactionEmoji === tr.getObject("intro.goblets")[i].emoji) {
						BlockingUtils.unblockPlayer(entity.discordUserId, BlockingConstants.REASONS.GOBLET_CHOOSE);
						await applyMalus(malus, interaction, language, entity);
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
		await builtEmbed.editReply(interaction, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, BlockingConstants.REASONS.GOBLET_CHOOSE, collector));
	}
};