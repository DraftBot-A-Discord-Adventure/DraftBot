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
		this.stats.fightPoints = this.calculateStat(PVEConstants.STATS_FORMULA.ENERGY, level, monster.fightPointsRatio);
		this.stats.maxFightPoint = this.stats.fightPoints;
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

	chooseAction(fightView: FightView, response: DraftBotPacket[]): Promise<void> {
		/* eslint-disable capitalized-comments */
		/* fightView.channel.send({
			embeds: [
				new DraftBotEmbed()
					.setDescription(fightView.fightTranslationModule.get("actions.aiChoose"))
			]
		})
			.then((embed) => { */
		const fightAction = this.getRandomAvailableFightAction();
		setTimeout(async function() {
			// await embed.delete();
			await fightView.fightController.executeFightAction(fightAction, true, response);
		}, RandomUtils.draftbotRandom.integer(500, 2000));
		return Promise.resolve();
	}

	endFight(): Promise<void> {
		return Promise.resolve();
	}

	getMention(): string {
		return this.name;
	}

	getName(): string {
		return this.name;
	}

	startFight(): Promise<void> {
		return Promise.resolve();
	}

	unblock(): void {
		// Do nothing
	}
}
