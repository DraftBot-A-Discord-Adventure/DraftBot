import {ExecuteTestCommandLike, ITestCommand, TypeKey} from "../../../../core/CommandsTest";
import {FightController} from "../../../../core/fights/FightController";
import {PlayerFighter} from "../../../../core/fights/fighter/PlayerFighter";
import {FightOvertimeBehavior} from "../../../../core/fights/FightOvertimeBehavior";
import {FightStatModifierOperation} from "../../../../../../Lib/src/interfaces/FightStatModifierOperation";
import {ClassDataController} from "../../../../data/Class";

export const commandInfo: ITestCommand = {
	name: "solofight",
	commandFormat: "<instant>",
	typeWaited: {
		instant: TypeKey.INTEGER
	},
	description: "Faire un combat contre soi-même"
};

/**
 * Start a fight against yourself
 */
const soloFightTestCommand: ExecuteTestCommandLike = async (player, args, response) => {
	const playerClass = ClassDataController.instance.getById(player.class);
	const fighter1 = new PlayerFighter(player, playerClass);
	await fighter1.loadStats(false);
	const fighter2 = new PlayerFighter(player, playerClass);
	await fighter2.loadStats(false);

	if (args[0] === "1") {
		fighter1.applyAttackModifier({
			operation: FightStatModifierOperation.ADDITION,
			origin: null,
			value: 9999
		});
		fighter1.applyDefenseModifier({
			operation: FightStatModifierOperation.MULTIPLIER,
			origin: null,
			value: 0.01
		});
		fighter2.applyAttackModifier({
			operation: FightStatModifierOperation.ADDITION,
			origin: null,
			value: 9999
		});
		fighter2.applyDefenseModifier({
			operation: FightStatModifierOperation.MULTIPLIER,
			origin: null,
			value: 0.01
		});
	}
	// TODO: Replace with the right context
	new FightController({fighter1, fighter2}, {friendly: false, overtimeBehavior: FightOvertimeBehavior.END_FIGHT_DRAW}, response[0])
		.startFight()
		.then();

	return "";
};

commandInfo.execute = soloFightTestCommand;