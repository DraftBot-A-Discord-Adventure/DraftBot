import {FightWeatherEnum} from "../../../FightWeather";
import {defaultFightActionResult} from "../../../../../../../Lib/src/types/FightActionResult";
import {FightActionFunc} from "../../../../../data/FightAction";

const use: FightActionFunc = (sender, _receiver, _fightAction, turn, fight) => {
	fight.setWeather(FightWeatherEnum.FIRESTORM, turn, sender);
	return defaultFightActionResult();
};
export default use;
