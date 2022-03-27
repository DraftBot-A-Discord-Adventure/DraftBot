import {CommandInteraction, MessageEmbed, TextChannel} from "discord.js";
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

export const smallEvent: SmallEvent = {
	canBeExecuted(): Promise<boolean> {
		return Promise.resolve(true);
	},

	async executeSmallEvent(interaction: CommandInteraction, language: string, entity: any, seEmbed: MessageEmbed) {
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
				await entity.addHealth(-malus.option, <TextChannel> interaction.channel, language);
				console.log(entity.discordUserId + "got a bad level small event and lost" + malus.option + "💔");
				break;
			case "time":
				await Maps.applyEffect(entity.Player, Constants.EFFECT.OCCUPIED, malus.option);
				malus.option = minutesDisplay(malus.option);
				console.log(entity.discordUserId + "got a bad level small event and lost" + malus.option);
				break;
			case "nothing":
				console.log(entity.discordUserId + "got a bad level small event but didn't lost anything");
				break;
			case "end":
				await entity.addHealth(-malus.option, <TextChannel> interaction.channel, language);
				console.log(entity.discordUserId + "got a bad level small event and didn't react (" + malus.option + "💔)");
				break;
			default:
				throw new Error("reward type not found");
			}
			await entity.Player.killIfNeeded(entity, <TextChannel> interaction.channel, language);
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
			.allowUser(interaction.user)
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
						await chooseGobletMessage.sentMessage.channel.send({embeds: [generateEndMessage(malus, currentGoblet.name)]});
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
		builtEmbed.formatAuthor(Translations.getModule("commands.report", language).get("journal"), interaction.user);
		builtEmbed.setDescription(
			seEmbed.description
			+ intro
			+ tr.getRandom("intro.intrigue")
			+ goblets
		);
		await builtEmbed.send(interaction.channel, (collector) => BlockingUtils.blockPlayerWithCollector(entity.discordUserId, "gobletChoose", collector));
	}
};