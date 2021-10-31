export type IMission = {
	paramsToVariant(params: { [key: string]: any }): number;

	generateRandomVariant(): number;
}