import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {Translations} from "../../../../Translations";
import {NumberChangeReason} from "../../../../constants/LogsConstants";
import {PVEConstants} from "../../../../constants/PVEConstants";

export default class RageExplosion extends FightAction {
	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		let damages = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		damages *= Math.min(
			Math.max(
				(<PlayerFighter>sender).player.rage / 2,
				PVEConstants.RAGE_MIN_MULTIPLIER),
			Math.min(PVEConstants.RAGE_MAX_MULTIPLIER, Math.round(receiver.getFightPoints() / (damages * PVEConstants.RAGE_MAX_PROPORTION)))
		);
		(<PlayerFighter>sender).player.setRage(0, NumberChangeReason.RAGE_EXPLOSION_ACTION).then();
		receiver.damage(damages);
		return Translations.getModule(`fightactions.${this.name}`, language).get("use")
			+ Translations.getModule("commands.fight", language).format("actions.damages", {
				damages
			});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 75, averageDamage: 125, maxDamage: 200};
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