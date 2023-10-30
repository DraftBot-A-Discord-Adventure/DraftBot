import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleAlterationFightAction} from "@Core/src/core/fights/actions/templates/SimpleAlterationFightActionTemplate";

const use: FightActionFunc = (sender) => simpleAlterationFightAction(sender, {
	selfTarget: true,
	alteration: FightAlterations.CONCENTRATED
});

export default use;