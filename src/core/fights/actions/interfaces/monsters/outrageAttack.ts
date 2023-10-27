import {FightAlterations} from "../../FightAlterations";
import {FightActionFunc} from "@Core/src/data/FightAction";
import {simpleAlterationFightAction} from "@Core/src/core/fights/actions/templates/SimpleAlterationFightActionTemplate";
import {FightAlterationDataController} from "@Core/src/data/FightAlteration";


const use: FightActionFunc = (sender) => simpleAlterationFightAction(sender, {
	selfTarget: true,
	alteration: FightAlterationDataController.instance.getById(FightAlterations.OUTRAGE)
});

export default use;