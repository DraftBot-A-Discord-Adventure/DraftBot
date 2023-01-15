export enum CompletedMissionType {
	NORMAL,
	DAILY,
	CAMPAIGN
}

export class CompletedMission {
	public readonly pointsToWin: number;

	public readonly xpToWin: number;

	public readonly gemsToWin: number;

	public readonly moneyToWin: number;

	public readonly desc: string;

	public readonly completedMissionType: CompletedMissionType;

	constructor(pointsToWin: number,xpToWin: number, gemsToWin: number, moneyToWin: number, desc: string, type: CompletedMissionType) {
		this.pointsToWin = pointsToWin;
		this.xpToWin = xpToWin;
		this.gemsToWin = gemsToWin;
		this.moneyToWin = moneyToWin;
		this.desc = desc;
		this.completedMissionType = type;
	}
}