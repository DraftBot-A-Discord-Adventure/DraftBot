export enum MissionType {
	NORMAL = "sideMissions",
	DAILY = "daily",
	CAMPAIGN = "campaign"
}

export interface CompletedMission extends BaseMission {
	pointsToWin: number,
	xpToWin: number,
	gemsToWin: number,
	moneyToWin: number,
}

export type BaseMission = {
	missionId: string,
	missionObjective: number
	missionVariant: number
	numberDone: number
	saveBlob: Buffer
	missionType: MissionType,
	expireAt?: Date,
	fightAction?: string
}