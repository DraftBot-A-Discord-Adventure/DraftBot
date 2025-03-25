import {Fighter} from "./Fighter";
import {FightView} from "../FightView";
import {RandomUtils} from "../../../../../Lib/src/utils/RandomUtils";
import {PVEConstants} from "../../../../../Lib/src/constants/PVEConstants";
import {FighterStatus} from "../FighterStatus";
import {Monster} from "../../../data/Monster";
import {FightAction, FightActionDataController} from "../../../data/FightAction";
import {DraftBotPacket} from "../../../../../Lib/src/packets/DraftBotPacket";

export class MonsterFighter extends Fighter {

	public readonly monster: Monster;

	private readonly name: string;

	public constructor(level: number, monster: Monster) {
		const attacks: FightAction[] = [];
		for (const attack of monster.attacks) {
			if (level >= attack.minLevel) {
				const monsterAttackToAdd = FightActionDataController.instance.getById(attack.id);
				monsterAttackToAdd.setWeightForRandomSelection(attack.weight);
				attacks.push(monsterAttackToAdd);
			}
		}
		super(level, attacks);
		this.stats.energy = this.calculateStat(PVEConstants.STATS_FORMULA.ENERGY, level, monster.energyRatio);
		this.stats.maxEnergy = this.stats.energy;
		this.stats.attack = this.calculateStat(PVEConstants.STATS_FORMULA.ATTACK, level, monster.attackRatio);
		this.stats.defense = this.calculateStat(PVEConstants.STATS_FORMULA.DEFENSE, level, monster.defenseRatio);
		this.stats.speed = this.calculateStat(PVEConstants.STATS_FORMULA.SPEED, level, monster.speedRatio);
		this.stats.breath = monster.breath;
		this.stats.maxBreath = monster.maxBreath;
		this.stats.breathRegen = monster.breathRegen;
		this.monster = monster;
		this.status = FighterStatus.NOT_STARTED;
	}

	calculateStat(stat: { A: number, B: number, C: number }, level: number, ratio: number): number {
		return Math.round(Math.round(stat.A * level * level + stat.B * level + stat.C) * ratio / 100.0);
	}

	async chooseAction(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		const fightAction = this.getRandomAvailableFightAction();
		await new Promise(f => setTimeout(f, RandomUtils.randInt(300, 1800)));
		await fightView.fightController.executeFightAction(fightAction, true, response);
	}

	endFight(): Promise<void> {
		return Promise.resolve();
	}

	startFight(): Promise<void> {
		return Promise.resolve();
	}

	unblock(): void {
		// Do nothing
	}
}
