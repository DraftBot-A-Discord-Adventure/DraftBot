import {Fighter} from "../../../fighter/Fighter";
import {FightActionController} from "../../FightActionController";
import {attackInfo, FightAction, statsInfo} from "../../FightAction";
import {PlayerFighter} from "../../../fighter/PlayerFighter";
import {Translations} from "../../../../Translations";
import {NumberChangeReason} from "../../../../constants/LogsConstants";
import {PVEConstants} from "../../../../constants/PVEConstants";

export default class RageExplosion extends FightAction {
	use(fightAction: FightAction, sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		let damages = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		damages *=
			Math.round(
				Math.min(
					Math.max(
						(<PlayerFighter>sender).player.rage,
						PVEConstants.RAGE_MIN_MULTIPLIER
					)
					,
					PVEConstants.RAGE_MAX_DAMAGE + (<PlayerFighter>sender).player.level
				)
			);
		(<PlayerFighter>sender).player.setRage(0, NumberChangeReason.RAGE_EXPLOSION_ACTION).then();
		receiver.damage(damages);
		return Translations.getModule(`fightactions.${this.name}`, language).get("use")
			+ Translations.getModule("commands.fight", language).format("actions.damages", {
				damages
			});
	}

	getAttackInfo(): attackInfo {
		return {minDamage: 10, averageDamage: 45, maxDamage: 85};
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