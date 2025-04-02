export enum MissionType {
	NORMAL = "sideMission",
	DAILY = "daily",
	CAMPAIGN = "campaign"
}

export interface CompletedMission extends BaseMission {
	pointsToWin: number;
	xpToWin: number;
	gemsToWin: number;
	moneyToWin: number;
}

export type BaseMission = {
	missionId: string;
	missionObjective: number;
	missionVariant: number;
	numberDone: number;
	saveBlob: Buffer;
	missionType: MissionType;
	expiresAt?: string;
	fightAction?: string;
	mapType?: string;
};
