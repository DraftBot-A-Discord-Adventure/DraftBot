import {WitchEvent} from "../WitchEvent";
import Player from "../../database/game/models/Player";
import {TravelTime} from "../../maps/TravelTime";
import {EffectsConstants} from "../../constants/EffectsConstants";
import {NumberChangeReason} from "../../constants/LogsConstants";
import {SmallEventConstants} from "../../constants/SmallEventConstants";
import {MissionsController} from "../../missions/MissionsController";
import {CommandInteraction} from "discord.js";

/**
 * The beer can make the player drunk or do nothing
 */
export default class Beer extends WitchEvent {

	public constructor() {
		super("beer");
		this.type = SmallEventConstants.WITCH.ACTION_TYPE.INGREDIENT;
		this.effectName = "drunk";
		this.setOutcomeProbabilities(0, 25, 0, 25);
		this.tags = ["drinkAlcohol"];
	}

	/**
	 * The beer can make the player drunk
	 * @param player
	 */
	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.DRUNK,
			this.timePenalty,
			new Date(),
			NumberChangeReason.SMALL_EVENT
		);
	}

	/**
	 * The beer should make the player get the mission "drink alcohol"
	 * @param interaction
	 * @param player
	 * @param language
	 * @param outcome
	 */
	async checkMissions(interaction: CommandInteraction, player: Player, language: string, outcome: number): Promise<void> {
		if (outcome === SmallEventConstants.WITCH.OUTCOME_TYPE.EFFECT) {
			await MissionsController.update(player, interaction.channel, language, {
				missionId: this.tags[0],
				params: {tags: this.tags}
			});
		}
	}
}
