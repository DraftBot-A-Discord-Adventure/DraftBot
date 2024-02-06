import Resources from "./resources";

declare module "i18next" {
	interface CustomTypeOptions {
		// Custom resources type
		resources: Resources;
	}
}