import {WitchEvent} from "../../WitchEvent";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";
import {TravelTime} from "../../../maps/TravelTime";
import {EffectsConstants} from "../../../constants/EffectsConstants";
import {NumberChangeReason} from "../../../constants/LogsConstants";

export default class SmallWait extends WitchEvent {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		return await Promise.resolve();
	}

	async giveEffect(player: Player): Promise<void> {
		await TravelTime.applyEffect(
			player,
			EffectsConstants.EMOJI_TEXT.OCCUPIED,
			15,
			new Date(),
			NumberChangeReason.SMALL_EVENT,
			new Date()
		);
	}
}