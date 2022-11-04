import {Fighter} from "./Fighter";
import {FightActions} from "../actions/FightActions";
import {FightView} from "../FightView";
import {DraftBotEmbed} from "../../messages/DraftBotEmbed";
import {RandomUtils} from "../../utils/RandomUtils";
import Monster from "../../database/game/models/Monster";
import MonsterAttack from "../../database/game/models/MonsterAttack";
import {FightAction} from "../actions/FightAction";

export class AIFighter extends Fighter {

	private readonly name: string;

	public constructor(level: number, monster: Monster, monsterAttacks: MonsterAttack[], language: string) {
		const attacks: FightAction[] = [];
		for (const attack of monsterAttacks) {
			if (level >= attack.minLevel) {
				attacks.push(FightActions.getFightActionById(attack.attackId));
			}
		}
		super(level, attacks);
		this.stats.fightPoints = this.calculateStat(monster.baseFightPoints, level);
		this.stats.maxFightPoint = this.stats.fightPoints;
		this.stats.attack = this.calculateStat(monster.baseAttack, level);
		this.stats.defense = this.calculateStat(monster.baseDefense, level);
		this.stats.speed = this.calculateStat(monster.baseSpeed, level);
		this.name = monster.getName(language);
	}

	calculateStat(base: number, level: number): number {
		return Math.round(base + base / 100 * level / 4 * level / 10);
	}

	chooseAction(fightView: FightView): void {
		fightView.channel.send({
			embeds: [
				new DraftBotEmbed()
					.setDescription(fightView.fightTranslationModule.get("actions.aiChoose"))
			]
		}).then((embed) => {
			const fightAction = this.getRandomAvailableFightAction();
			setTimeout(async function() {
				await embed.delete();
				await fightView.fightController.executeFightAction(fightAction, true);
			}, RandomUtils.draftbotRandom.integer(500, 2000));
		});
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

}