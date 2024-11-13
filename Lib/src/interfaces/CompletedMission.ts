export enum CompletedMissionType {
	NORMAL = "sideMissions",
	DAILY = "daily",
	CAMPAIGN = "campaign"
}

export interface CompletedMission extends BaseMission {
	pointsToWin: number,
	xpToWin: number,
	gemsToWin: number,
	moneyToWin: number,
	completedMissionType: CompletedMissionType
}

export type BaseMission = {
	missionId: string,
	missionObjective: number
	missionVariant: number,
	numberDone: number
	saveBlob: Buffer
	fightAction?: string
}