import {BaseMission} from "../../../Lib/src/interfaces/CompletedMission";
import {Language} from "../../../Lib/src/Language";
import i18n from "../translations/i18n";
import {MissionUtils as MissionUtilsLib} from "../../../Lib/src/utils/MissionUtils";
import {hoursToMilliseconds, hoursToSeconds, millisecondsToSeconds} from "../../../Lib/src/utils/TimeUtils";

export class MissionUtils {

	/**
	 * Get the displayable version of a mission (only the plain objective)
	 * @param mission
	 * @param lng
	 */
	static formatBaseMission(mission: BaseMission, lng: Language): string {
		return i18n.t(`models:missions.${mission.missionId}`, {
			lng,
			count: mission.missionObjective,
			variantText: this.getVariantText(mission, lng)
		});
	}

	/**
	 * Get the text version of a mission variant
	 * @param mission
	 * @param lng
	 * @private
	 */
	private static getVariantText(mission: BaseMission, lng: Language): string {
		if (mission.missionId === "fromPlaceToPlace") {
			return this.manageFromPlaceToPlaceVariant(mission, lng);
		}
		if (["fightAttacks", "finishWithAttack"].includes(mission.missionId)) {
			// TODO: remove above if and below if, before release : throw if fightAction is not set
			if (!mission.fightAction) {
				throw new Error("fightAction is not set for a fight mission");
			}
			if (mission.missionId === "fightAttacks") {
				return i18n.t("models:missionsVariants.fightAttacks", {
					lng,
					count: mission.missionObjective,
					variant: mission.fightAction
				});
			}
			return i18n.t("models:missionsVariants.finishWithAttack", {
				lng,
				variant: mission.fightAction
			}).toLowerCase();
		}
		return i18n.t(`models:missionsVariants.${mission.missionId}`, {
			lng,
			variant: mission.missionVariant
		});
	}

	/**
	 * Get the displayable version of a fromPlaceToPlace mission variant (which is the whole text)
	 * @param mission
	 * @param lng
	 * @private
	 */
	private static manageFromPlaceToPlaceVariant(mission: BaseMission, lng: Language): string {
		const params = MissionUtilsLib.fromPlaceToPlaceParamsFromVariant(mission.missionVariant);
		const saveData = MissionUtilsLib.fromPlaceToPlaceDataFromSaveBlob(mission.saveBlob);
		if (!saveData || saveData.startTimestamp + hoursToMilliseconds(params.time) < Date.now()) {
			return i18n.t("models:missionsVariants.fromPlaceToPlace", {
				lng,
				place1: i18n.t(`models:map_locations.${params.fromMap}.name`, {lng}),
				place2: i18n.t(`models:map_locations.${params.toMap}.name`, {lng}),
				time: params.time,
				context: params.orderMatter ? "order" : "noOrder"
			});
		}
		return i18n.t("models:missionsVariants.fromPlaceToPlace_secondPart", {
			lng,
			place: i18n.t(`models:map_locations.${saveData.startMap === params.fromMap ? params.toMap : params.fromMap}.name`, {lng}),
			timestamp: Math.round(millisecondsToSeconds(saveData.startTimestamp)) + hoursToSeconds(params.time)
		});
	}
}