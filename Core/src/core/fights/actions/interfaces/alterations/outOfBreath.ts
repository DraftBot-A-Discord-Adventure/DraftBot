import { defaultFightAlterationResult } from "../../../FightController";
import { FightAlterationFunc } from "../../../../../data/FightAlteration";

const use: FightAlterationFunc = (affected, _fightAlteration) => {
	affected.nextFightAction = null;
	return {
		...defaultFightAlterationResult()
	};
};

export default use;
