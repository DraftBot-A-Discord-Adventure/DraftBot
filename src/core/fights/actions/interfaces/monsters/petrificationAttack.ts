import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleAlterationFightAction} from "@Core/src/core/fights/actions/templates/SimpleAlterationFightActionTemplate";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";

const use: FightActionFunc = (_sender, receiver) => simpleAlterationFightAction(receiver, {
	selfTarget: false,
	alteration: FightAlterationDataController.instance.getById(FightAlterations.PETRIFIED)
});

export default use;