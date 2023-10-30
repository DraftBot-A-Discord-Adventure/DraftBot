import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleAlterationFightAction} from "@Core/src/core/fights/actions/templates/SimpleAlterationFightActionTemplate";

const use: FightActionFunc = (_sender, receiver) => simpleAlterationFightAction(receiver, {
	selfTarget: false,
	alteration: FightAlterations.PETRIFIED
});

export default use;