import {attackInfo, FightAction, statsInfo} from "../FightAction";
import {Fighter} from "../../fighter/Fighter";
import {FightActionController} from "../FightActionController";

export abstract class SimpleDamageFightActionTemplate extends FightAction {
	private readonly criticalHitProbability: number;

	private readonly failureProbability: number;

	protected constructor(name: string, criticalHitProbability: number, failureProbability: number) {
		super(name);
		this.criticalHitProbability = criticalHitProbability;
		this.failureProbability = failureProbability;
	}

	use(sender: Fighter, receiver: Fighter, turn: number, language: string): string {
		const initialDamage = FightActionController.getAttackDamage(this.getStatsInfo(sender, receiver), sender, this.getAttackInfo());
		const damageDealt = FightActionController.applySecondaryEffects(initialDamage, this.criticalHitProbability, this.failureProbability);
		receiver.damage(damageDealt);
		return this.getGenericAttackOutput(damageDealt, initialDamage, language);
	}

	abstract getAttackInfo(): attackInfo;

	abstract getStatsInfo(sender: Fighter, receiver: Fighter): statsInfo;
}