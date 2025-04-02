import { FightAlterations } from "../../FightAlterations";
import { FightActionFunc } from "../../../../../data/FightAction";
import { simpleAlterationFightAction } from "../../templates/SimpleAlterationFightActionTemplate";

const use: FightActionFunc = (_sender, receiver) => simpleAlterationFightAction(receiver, {
	selfTarget: false,
	alteration: FightAlterations.PETRIFIED
});

export default use;
