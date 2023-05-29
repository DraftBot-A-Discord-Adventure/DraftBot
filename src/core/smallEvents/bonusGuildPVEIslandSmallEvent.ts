import {SmallEvent} from "./SmallEvent";
import {CommandInteraction} from "discord.js";
import {DraftBotEmbed} from "../messages/DraftBotEmbed";
import Player from "../database/game/models/Player";
import {Maps} from "../maps/Maps";
import {Translations} from "../Translations";
import {RandomUtils} from "../utils/RandomUtils";
import {Guilds} from "../database/game/models/Guild";
import {NumberChangeReason} from "../constants/LogsConstants";
import {Data} from "../Data";
import {TextInformation} from "../utils/MessageUtils";


/**
 * Give possibility to the player or the guild and return the applied number
 * @param textInformation
 * @param player
 * @param malusTarget
 */
async function applyPossibility(textInformation: TextInformation,player: Player, malusTarget: string): Promise<string> {
	const data = Data.getModule("smallEvents.bonusGuildPVEIsland");
	const malusName = data.getString(`${malusTarget}.name`);
	const amount = RandomUtils.randInt(data.getNumber(`${malusTarget}.min`), data.getNumber(`${malusTarget}.max`));

	if (malusName === "expOrPointsGuild") {
		const guild = await Guilds.getById(player.guildId);
		let emoji;
		if (RandomUtils.draftbotRandom.bool()) {
			await guild.addExperience(amount, textInformation.interaction.channel, textInformation.language, NumberChangeReason.SMALL_EVENT);
			emoji = ":star:";
		}
		else {
			await guild.addScore(amount);
			emoji = ":mirror_ball:";
		}
		await guild.save();
		return `${amount.toString()} ${emoji}`;
	}

	switch (malusName) {
	case "money":
		await player.addMoney({
			amount: -amount,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.SMALL_EVENT
		});
		break;
	case "exp":
		await player.addExperience({
			amount,
			channel: textInformation.interaction.channel,
			language: textInformation.language,
			reason: NumberChangeReason.SMALL_EVENT
		});
		break;
	case "life":
		await player.addHealth(-amount, textInformation.interaction.channel, textInformation.language, NumberChangeReason.SMALL_EVENT);
		await player.killIfNeeded(textInformation.interaction.channel, textInformation.language, NumberChangeReason.SMALL_EVENT);
		break;
	case "energy":
		player.addEnergy(-amount, NumberChangeReason.SMALL_EVENT);
		break;
	default:
		break;
	}
	await player.save();
	return amount.toString();
}

export const smallEvent: SmallEvent = {
	/**
	 * Check if small event can be executed
	 */
	canBeExecuted(player: Player): Promise<boolean> {
		return Promise.resolve(Maps.isOnPveIsland(player));
	},

	/**
	 * Execute small event
	 * @param interaction
	 * @param language
	 * @param player
	 * @param seEmbed
	 */
	async executeSmallEvent(interaction: CommandInteraction, language: string, player: Player, seEmbed: DraftBotEmbed): Promise<void> {
		const tr = Translations.getModule("smallEvents.bonusGuildPVEIsland", language);
		const event = tr.getRandomFromKeys("events");
		const intro = tr.get(`events.${event}.intro`);

		let sentence;
		if (player.isInGuild()) {
			const nbMemberRequired = RandomUtils.randInt(1, 4);
			const playersOnPVEIsland = await Maps.getGuildMembersOnPveIsland(player);
			if (playersOnPVEIsland.length >= nbMemberRequired) {
				sentence = tr.format(`events.${event}.success.withGuild`, {
					amount: await applyPossibility({interaction, language, tr}, player, `${event}.success.withGuild.malus`)
				});
				seEmbed.setDescription(`${seEmbed.data.description}${intro}\n\n${sentence}`);
				await interaction.editReply({embeds: [seEmbed]});
				return;
			}
		}

		const probabilities = RandomUtils.randInt(0, 100);
		if (probabilities < 10) {
			sentence = player.isInGuild() ? tr.format(`events.${event}.success.soloWithGuild`, {
				amount: await applyPossibility({interaction, language, tr}, player, `${event}.success.withGuild.malus`)
			}) : tr.format(`events.${event}.success.solo`,{
				amount: await applyPossibility({interaction, language, tr}, player, `${event}.success.solo.malus`)
			});
		}
		else if (probabilities < 40) {
			sentence = player.isInGuild() ? tr.get(`events.${event}.escape.withGuild`) : tr.get(`events.${event}.escape.solo`);
		}
		else {
			sentence = player.isInGuild() ? sentence = tr.format(`events.${event}.lose.withGuild`, {
				amount: await applyPossibility({interaction, language, tr}, player, `${event}.lose.withGuild.malus`)
			}) : tr.format(`events.${event}.lose.solo`, {
				amount: await applyPossibility({interaction, language, tr}, player, `${event}.lose.solo.malus`)
			});
		}

		seEmbed.setDescription(`${seEmbed.data.description}${intro}\n\n${sentence}`);
		await interaction.editReply({embeds: [seEmbed]});
	}
};