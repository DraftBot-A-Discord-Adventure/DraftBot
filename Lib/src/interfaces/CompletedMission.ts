export enum CompletedMissionType {
	NORMAL,
	DAILY,
	CAMPAIGN
}

export interface CompletedMission {
	missionId: string,
	missionObjective: number
	missionVariant: number,
	numberDone: number,
	pointsToWin: number,
	xpToWin: number,
	gemsToWin: number,
	moneyToWin: number,
	completedMissionType: CompletedMissionType
}