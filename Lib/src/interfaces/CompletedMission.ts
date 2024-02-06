export enum CompletedMissionType {
    NORMAL,
    DAILY,
    CAMPAIGN
}

export interface CompletedMission {
    missionId: string,
    objective: number
    variant: number,
    numberDone: number,
    points: number,
    xp: number,
    gems: number,
    money: number,
    completedMissionType: CompletedMissionType
}