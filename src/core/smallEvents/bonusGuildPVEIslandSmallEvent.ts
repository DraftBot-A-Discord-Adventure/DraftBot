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
async function applyPossibility(textInformation: TextInformation, player: Player, malusTarget: string): Promise<[string, boolean?]> {
	const data = Data.getModule("smallEvents.bonusGuildPVEIsland");
	const malusName = data.getString(`${malusTarget}.name`);
	const amount = RandomUtils.randInt(data.getNumber(`${malusTarget}.min`), data.getNumber(`${malusTarget}.max`));

	if (malusName === "expOrPointsGuild") {
		const guild = await Guilds.getById(player.guildId);
		const draw = RandomUtils.draftbotRandom.bool();
		if (draw) {
			await guild.addExperience(amount, textInformation.interaction.channel, textInformation.language, NumberChangeReason.SMALL_EVENT);
		}
		else {
			await guild.addScore(amount, NumberChangeReason.SMALL_EVENT);
		}
		await guild.save();
		return [amount.toString(), draw];
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
	return [amount.toString()];
}


async function getText(textInformation: TextInformation, player: Player, malus: string, sentence: string): Promise<string> {
	const [amount, isXp] = await applyPossibility(textInformation, player, malus);
	return textInformation.tr.format(sentence, {
		amount,
		isXp
	});
}


async function drawPossibilities(textInformation: TextInformation, player: Player, event: string, forceWin: boolean): Promise<string> {
	if (forceWin) {
		return await getText(textInformation, player, `${event}.success.withGuild.malus`, `events.${event}.success.withGuild`);
	}

	const probabilities = RandomUtils.randInt(0, 100);
	if (probabilities < 10) {
		if (player.isInGuild()) {
			return await getText(textInformation, player, `${event}.success.withGuild.malus`, `events.${event}.success.soloWithGuild`);
		}
		return await getText(textInformation, player, `${event}.success.solo.malus`, `events.${event}.success.solo`);
	}
	else if (probabilities < 40) {
		return player.isInGuild() ? textInformation.tr.get(`events.${event}.escape.withGuild`) : textInformation.tr.get(`events.${event}.escape.solo`);
	}

	return player.isInGuild() ?
		await getText(textInformation, player, `${event}.lose.withGuild.malus`, `events.${event}.lose.withGuild`) :
		await getText(textInformation, player, `${event}.lose.solo.malus`, `events.${event}.lose.solo`);
}


async function hasEnoughMemberOnPVEIsland(player: Player): Promise<boolean> {
	return (await Maps.getGuildMembersOnPveIsland(player)).length >= RandomUtils.randInt(1, 4);
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

		const sentence = await drawPossibilities({interaction, language, tr}, player, event, player.isInGuild() ? await hasEnoughMemberOnPVEIsland(player) : false);

		seEmbed.setDescription(`${seEmbed.data.description}${intro}\n\n${sentence}`);
		await interaction.editReply({embeds: [seEmbed]});
	}
};