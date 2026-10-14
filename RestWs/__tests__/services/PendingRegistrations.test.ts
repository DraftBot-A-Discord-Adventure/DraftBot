import {beforeEach, describe, expect, it, vi} from "vitest";
import {PendingRegistrations} from "../../src/services/PendingRegistrations";
import {KeycloakUtils} from "../../../Lib/src/keycloak/KeycloakUtils";
import {KeycloakUser} from "../../../Lib/src/keycloak/KeycloakUser";

vi.mock("../../src/index", () => ({keycloakConfig: {}}));
vi.mock("../../../Lib/src/keycloak/KeycloakUtils", () => ({KeycloakUtils: {getPendingRegistrations: vi.fn(), getUserByKeycloakId: vi.fn(), deleteUser: vi.fn()}}));

const NOW = 10_000_000;
function account(id: string, verified = false): KeycloakUser {
	return {id, username: id, attributes: {gameUsername: [id], registrationPending: ["true"]}, emailVerified: verified, createdTimestamp: NOW - 4_000_000} as KeycloakUser;
}

describe("pending registration cleanup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(KeycloakUtils.deleteUser).mockResolvedValue({isError: false, status: 204, payload: {}});
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: false, status: 200, payload: {users: []}});
	});

	it("deletes only an explicitly pending expired registration", async () => {
		const user = account("pending");
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: false, status: 200, payload: {users: [user]}});
		vi.mocked(KeycloakUtils.getUserByKeycloakId).mockResolvedValue({isError: false, status: 200, payload: {user}});
		await PendingRegistrations.review(NOW);
		expect(KeycloakUtils.deleteUser).toHaveBeenCalledWith({}, "pending");
	});

	it("preserves a registration confirmed before the final read", async () => {
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: false, status: 200, payload: {users: [account("pending")]}});
		vi.mocked(KeycloakUtils.getUserByKeycloakId).mockResolvedValue({isError: false, status: 200, payload: {user: account("pending", true)}});
		await PendingRegistrations.review(NOW);
		expect(KeycloakUtils.deleteUser).not.toHaveBeenCalled();
	});

	it("never removes a historical bot account without the registration marker", async () => {
		const user = account("discord-legacy");
		delete user.attributes.registrationPending;
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: false, status: 200, payload: {users: [user]}});
		await PendingRegistrations.review(NOW);
		expect(KeycloakUtils.deleteUser).not.toHaveBeenCalled();
	});

	it("preserves a recent registration waiting for its email", async () => {
		const user = {...account("new"), createdTimestamp: NOW - 1};
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: false, status: 200, payload: {users: [user]}});
		await PendingRegistrations.review(NOW);
		expect(KeycloakUtils.deleteUser).not.toHaveBeenCalled();
	});

	it("reads all pages before deleting so deletion cannot skip a page", async () => {
		const users = Array.from({length: 100}, (_unused, index) => account(`pending-${index}`));
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValueOnce({isError: false, status: 200, payload: {users}})
			.mockResolvedValueOnce({isError: false, status: 200, payload: {users: [account("last")]}});
		vi.mocked(KeycloakUtils.getUserByKeycloakId).mockImplementation(async (_config, id) => ({isError: false, status: 200, payload: {user: account(id)}}));
		await PendingRegistrations.review(NOW);
		expect(KeycloakUtils.getPendingRegistrations).toHaveBeenNthCalledWith(2, {}, 100, 100);
		expect(KeycloakUtils.deleteUser).toHaveBeenCalledTimes(101);
	});

	it("does not delete on an unavailable page", async () => {
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: true, status: 503, payload: {}});
		await expect(PendingRegistrations.review(NOW)).rejects.toThrow();
		expect(KeycloakUtils.deleteUser).not.toHaveBeenCalled();
	});

	it("preserves a pending row that is no longer marked on the final read", async () => {
		const user = account("pending");
		vi.mocked(KeycloakUtils.getPendingRegistrations).mockResolvedValue({isError: false, status: 200, payload: {users: [user]}});
		const current = account("pending");
		delete current.attributes.registrationPending;
		vi.mocked(KeycloakUtils.getUserByKeycloakId).mockResolvedValue({isError: false, status: 200, payload: {user: current}});
		await PendingRegistrations.review(NOW);
		expect(KeycloakUtils.deleteUser).not.toHaveBeenCalled();
	});
});