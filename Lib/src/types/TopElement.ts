export type TopElementScoreFirstType = {
	effectId?: string; mapType?: string; afk: boolean;
};

export interface TopElement<T, U, V> {
	rank: number;

	sameContext: boolean;

	text: string;

	attributes: {
		1: T;
		2: U;
		3: V;
	};
}
