export enum CompletedMissionType {
	NORMAL,
	DAILY,
	CAMPAIGN
}

export class CompletedMission {
	public readonly xpToWin: number;

	public readonly gemsToWin: number;

	public readonly moneyToWin: number;

	public readonly desc: string;

	public readonly completedMissionType: CompletedMissionType;

	constructor(xpToWin: number, gemsToWin: number, moneyToWin: number, desc: string, type: CompletedMissionType) {
		this.xpToWin = xpToWin;
		this.gemsToWin = gemsToWin;
		this.moneyToWin = moneyToWin;
		this.desc = desc;
		this.completedMissionType = type;
	}
}