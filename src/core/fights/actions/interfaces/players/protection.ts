import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleAlterationFightAction} from "@Core/src/core/fights/actions/templates/SimpleAlterationFightActionTemplate";

const use: FightActionFunc = (_fight, _fightAction, sender) => {
	return simpleAlterationFightAction(sender, {
		selfTarget: true,
		alteration: FightAlterations.PROTECTED
	});
};

export default use;
