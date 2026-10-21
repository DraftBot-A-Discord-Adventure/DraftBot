/**
 * The web build receives no notification to tap: expo-notifications has no web implementation of the last
 * response, and reading it there throws.
 */
export function useNotificationNavigation(): void {
	// Nothing to follow on the web.
}
