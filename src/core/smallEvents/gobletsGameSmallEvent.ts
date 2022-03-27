/**
 * Main function of small event
 * @param {module:"discord.js".Message} message
 * @param {"fr"|"en"} language
 * @param {Entities} entity
 * @param {module:"discord.js".MessageEmbed} seEmbed - The template embed to send.
 *    The description already contains the emote so you have to get it and add your text
 * @returns {Promise<>}
 */
import {Message, MessageEmbed} from "discord.js";
import {Translations} from "../Translations";
import {Data} from "../Data";
import {Constants} from "../Constants";
import {SmallEvent} from "./SmallEvent";
import {DraftBotReactionMessageBuilder} from "../messages/DraftBotReactionMessage";
import {DraftBotReaction} from "../messages/DraftBotReaction";
import {RandomUtils} from "../utils/RandomUtils";
import {Maps} from "../Maps";
import {format} from "../utils/StringFormatter";
import {minutesDisplay} from "../utils/TimeUtils";
import {BlockingUtils} from "../utils/BlockingUtils";

declare function log(text: string): void;

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	// eslint-disable-next-line require-await
	async executeSmallEvent(message: Message, language: string, entity: any, seEmbed: MessageEmbed) {
		function generateMalus(malus = data.getRandomStringFromArray("malusTypes")): any {
			switch (malus) {
			case "life":
				return {
					type: malus,
					option: Math.round(entity.Player.level / 6) + Constants.SMALL_EVENT.BASE_HEALTH_LOST_GOBLETS_GAME + RandomUtils.draftbotRandom.integer(-3, 3)
				};
			case "time":
				return {
					type: malus,
					option: Math.round(entity.Player.level / 3 * 1.25) + Constants.SMALL_EVENT.BASE_TIME_LOST_GOBLETS_GAME + RandomUtils.draftbotRandom.integer(0, 10)
				};
			case "nothing":
				return {
					type: malus
				};
			case "end":
				return {
					type: malus,
					option: Math.round(entity.Player.level / 8) + Constants.SMALL_EVENT.BASE_HEALTH_LOST_GOBLETS_GAME + RandomUtils.draftbotRandom.integer(-3, 3)
				};
			default:
			}
		}

		async function applyMalus(malus: any): Promise<void> {
			switch (malus.type) {
			case "life":
				await entity.addHealth(-malus.option, message.channel, language);
				log(entity.discordUserId + "got a bad level small event and lost" + malus.option + "💔");
				break;
			case "time":
				await Maps.applyEffect(entity.Player, Constants.EFFECT.OCCUPIED, malus.option);
				malus.option = minutesDisplay(malus.option);
				log(entity.discordUserId + "got a bad level small event and lost" + malus.option);
				break;
			case "nothing":
				log(entity.discordUserId + "got a bad level small event but didn't lost anything");
				break;
			case "end":
				await entity.addHealth(-malus.option, message.channel, language);
				log(entity.discordUserId + "got a bad level small event and didn't react (" + malus.option + "💔)");
				break;
			default:
				throw new Error("reward type not found");
			}
			await entity.Player.killIfNeeded(entity, message.channel, language);
			await entity.save();
			await entity.save();
		}

		function generateEndMessage(malus: any, goblet: string) {
			seEmbed.setDescription(format(tr.getRandom("results." + malus.type), {
				amount: malus.option,
				goblet: goblet
			}));
			return seEmbed;
		}

		const tr = Translations.getModule("smallEvents.gobletsGame", language);
		const data = Data.getModule("smallEvents.gobletsGame");

		const embed = new DraftBotReactionMessageBuilder()
			.allowUser(message.author)
			.endCallback(async (chooseGobletMessage) => {
				const reaction = chooseGobletMessage.getFirstReaction();
				const reactionEmoji = !reaction ? "🔚" : reaction.emoji.name;
				let malus = generateMalus();
				if (!reaction) {
					malus = generateMalus("end");
				}
				let currentGoblet: any;
				for (let i = 0; i < tr.getObjectSize("intro.goblets"); i++) {
					currentGoblet = tr.getObject("intro.goblets")[i];
					if (reactionEmoji === "🔚" || reactionEmoji === tr.getObject("intro.goblets")[i].emoji) {
						BlockingUtils.unblockPlayer(entity.discordUserId);
						await applyMalus(malus);
						await message.channel.send({embeds: [generateEndMessage(malus, currentGoblet.name)]});
						break;
					}
				}
			});

		const intro = Translations.getModule("smallEventsIntros", language).getRandom("intro");
		let goblets = "", gobletEmoji = "", currentGoblet: any;
		for (let i = 0; i < tr.getObjectSize("intro.goblets"); i++) {
			currentGoblet = tr.getObject("intro.goblets")[i];
			gobletEmoji = currentGoblet.emoji;
			goblets += gobletEmoji + " " + currentGoblet.desc;
			embed.addReaction(new DraftBotReaction(gobletEmoji));
		}
		const builtEmbed = embed.build();
		builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), message.author);
		builtEmbed.setDescription(
			seEmbed.description
			+ intro
			+ tr.getRandom("intro.intrigue")
			+ goblets
		);
		await builtEmbed.send(message.channel, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "gobletChoose", collector));
	}
};