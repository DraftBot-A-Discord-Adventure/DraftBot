import {WitchEvent} from "../../WitchEvent";
import {Interaction} from "discord.js";
import Player from "../../../database/game/models/Player";

export default class Cobweb extends WitchEvent {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async givePotion(interaction: Interaction, player: Player, language: string): Promise<void> {
		return await Promise.resolve();
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	async giveEffect(player: Player): Promise<void> {
		return await Promise.resolve();
	}
}
