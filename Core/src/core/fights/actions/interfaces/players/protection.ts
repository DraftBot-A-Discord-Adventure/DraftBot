import { FightAlterations } from "../../FightAlterations";
import { FightActionFunc } from "../../../../../data/FightAction";
import { simpleAlterationFightAction } from "../../templates/SimpleAlterationFightActionTemplate";

const use: FightActionFunc = sender => simpleAlterationFightAction(sender, {
	selfTarget: true,
	alteration: FightAlterations.PROTECTED
});

export default use;
