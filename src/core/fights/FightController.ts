import {Fighter} from "./Fighter";
import {FightState} from "./FightState";
import {FightView} from "./FightView";
import {RandomUtils} from "../utils/RandomUtils";

export class FightController {

	private fighters: Fighter[];

	private fightView: FightView

	private state: FightState;

	private turn: number;

	private friendly: boolean;

	public constructor(fighter1: Fighter, fighter2: Fighter, friendly: boolean) {
		this.fighters = [fighter1, fighter2];
		this.state = FightState.NOT_STARTED;
		this.turn = 0;
		this.friendly = friendly;
	}

	public async startFight() {
		// make the fighters ready
		for (let i = 0; i < this.fighters.length; i++) {
			await this.fighters[i].prepare(this.friendly);
			await this.fighters[i].consumePotionIfNeeded(this.friendly, this.fightView.channel, this.fightView.language);
			this.fighters[i].block();
		}

		// the player with the highest speed start the fight
		if (this.fighters[1].stats.speed > this.fighters[0].stats.speed || RandomUtils.draftbotRandom.bool() && this.fighters[1].stats.speed === this.fighters[0].stats.speed) {
			this.invertFighters();
		}
		this.fightView.introduceFight(this.fighters[0], this.fighters[1]);
	}

	/**
	 * Change who is the player 1 and who is the player 2.
	 * The player 1 start the fight.
	 */
	private invertFighters() {
		const temp = this.fighters[0];
		this.fighters[0] = this.fighters[1];
		this.fighters[1] = temp;
	}
}
