import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {Translations} from "../../../../Translations";

export default class RageExplosion extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const damages = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo()) * (<PlayerFighter>sender).player.rage;
		(<PlayerFighter>sender).player.setRage(0).then();
		receiver.damage(damages);
		return Translations.getModule(`fightactions.${this.name}`, language).get("use")
			+ Translations.getModule("commands.fight", language).format("actions.damages", {
				damages
			});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 25, averageDamage: 50, maxDamage: 100};
	}

	getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo {
		return {
			attackerStats: [
				sender.getAttack(),
				sender.getSpeed()
			], defenderStats: [
				receiver.getDefense(),
				receiver.getSpeed()
			], statsEffect: [
				0.7,
				0.3
			]
		};
	}
}