// Lets RestWs turn the Discord token of a player who opened the Discord Activity into a session of the app.
// Read-only by default; --apply grants the two token exchange permissions and the exit code stays 1 while one is missing.
//
// The exchange is Keycloak's external-to-internal token exchange, which only exists in the legacy
// implementation: Keycloak must run with --features=token-exchange,admin-fine-grained-authz:v1.
// Needs an account allowed to manage the clients, the identity providers and their permissions of the realm:
// either a service account of that realm (KEYCLOAK_CLIENT_ID / KEYCLOAK_CLIENT_SECRET), or a master admin
// (KEYCLOAK_ADMIN_USERNAME / KEYCLOAK_ADMIN_PASSWORD).

const APPLY_FLAG = "--apply";
const IDENTITY_PROVIDER = "discord";
const REQUESTER_CLIENT = process.env.ACTIVITY_REQUESTER_CLIENT ?? "restWs";
const AUDIENCE_CLIENT = process.env.ACTIVITY_AUDIENCE_CLIENT ?? "crownicles-app";
const POLICY_NAME = `discord-activity-${REQUESTER_CLIENT}`;
const TOKEN_EXCHANGE_SCOPE = "token-exchange";

function required(name) {
	const value = process.env[name];
	if (!value) throw new Error(`Missing ${name}`);
	return value;
}

function configuration() {
	return {url: required("KEYCLOAK_URL"), realm: required("KEYCLOAK_REALM")};
}

function applyRequested() {
	const unknown = process.argv.slice(2).filter(argument => argument !== APPLY_FLAG);
	if (unknown.length) throw new Error("Only --apply is supported; default is read-only");
	return process.argv.includes(APPLY_FLAG);
}

function credentials(config) {
	if (process.env.KEYCLOAK_ADMIN_USERNAME) {
		return {
			tokenUrl: `${config.url}/realms/master/protocol/openid-connect/token`,
			body: {grant_type: "password", client_id: "admin-cli", username: required("KEYCLOAK_ADMIN_USERNAME"), password: required("KEYCLOAK_ADMIN_PASSWORD")}
		};
	}
	return {
		tokenUrl: `${config.url}/realms/${config.realm}/protocol/openid-connect/token`,
		body: {grant_type: "client_credentials", client_id: required("KEYCLOAK_CLIENT_ID"), client_secret: required("KEYCLOAK_CLIENT_SECRET")}
	};
}

async function adminApi(config) {
	const {tokenUrl, body} = credentials(config);
	const response = await fetch(tokenUrl, {method: "POST", body: new URLSearchParams(body)});
	if (!response.ok) throw new Error(`Could not authenticate: HTTP ${response.status}`);
	const {access_token: token} = await response.json();
	return async (method, route, payload) => {
		const answer = await fetch(`${config.url}/admin/realms/${config.realm}${route}`, {
			method,
			headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json"},
			...(payload ? {body: JSON.stringify(payload)} : {})
		});
		const text = await answer.text();
		if (!answer.ok) throw new Error(`${method} ${route}: HTTP ${answer.status} ${text}`);
		return text ? JSON.parse(text) : null;
	};
}

async function clientId(api, name) {
	const [client] = await api("GET", `/clients?clientId=${encodeURIComponent(name)}`);
	if (!client) throw new Error(`Client ${name} does not exist`);
	return client.id;
}

/** The permissions of a guarded object; turning them on is what creates its token-exchange permission. */
async function tokenExchangePermission(api, route, apply) {
	let permissions = await api("GET", `${route}/management/permissions`);
	if (!permissions.enabled && apply) {
		permissions = await api("PUT", `${route}/management/permissions`, {enabled: true});
	}
	return permissions.enabled ? permissions.scopePermissions[TOKEN_EXCHANGE_SCOPE] : null;
}

async function requesterPolicy(api, authz, requesterId, apply) {
	const existing = await api("GET", `${authz}/policy?name=${encodeURIComponent(POLICY_NAME)}&type=client`);
	const policy = existing.find(candidate => candidate.name === POLICY_NAME);
	if (policy || !apply) return policy?.id ?? null;
	return (await api("POST", `${authz}/policy/client`, {name: POLICY_NAME, logic: "POSITIVE", clients: [requesterId]})).id;
}

/** A scope permission is replaced as a whole: its resources and scopes are sent back with the new policy. */
async function grant(api, authz, permissionId, policyId, apply) {
	const route = `${authz}/permission/scope/${permissionId}`;
	const policies = await api("GET", `${authz}/policy/${permissionId}/associatedPolicies`);
	if (policies.some(policy => policy.id === policyId)) return true;
	if (!apply) return false;
	const permission = await api("GET", route);
	const resources = await api("GET", `${authz}/policy/${permissionId}/resources`);
	const scopes = await api("GET", `${authz}/policy/${permissionId}/scopes`);
	await api("PUT", route, {
		...permission,
		decisionStrategy: "AFFIRMATIVE",
		resources: resources.map(resource => resource._id),
		scopes: scopes.map(scope => scope.id),
		policies: [...policies.map(policy => policy.id), policyId]
	});
	return true;
}

async function main() {
	const apply = applyRequested();
	const api = await adminApi(configuration());
	const requesterId = await clientId(api, REQUESTER_CLIENT);
	const audienceId = await clientId(api, AUDIENCE_CLIENT);
	const authz = `/clients/${await clientId(api, "realm-management")}/authz/resource-server`;
	const guarded = {
		[`identity provider ${IDENTITY_PROVIDER}`]: `/identity-provider/instances/${IDENTITY_PROVIDER}`,
		[`client ${AUDIENCE_CLIENT}`]: `/clients/${audienceId}`
	};

	// Keycloak only creates the authorization server holding the policies once a first permission is turned on.
	const permissionIds = {};
	for (const [label, route] of Object.entries(guarded)) {
		permissionIds[label] = await tokenExchangePermission(api, route, apply);
	}
	const policyId = Object.values(permissionIds).some(Boolean) ? await requesterPolicy(api, authz, requesterId, apply) : null;

	let missing = 0;
	for (const [label, permissionId] of Object.entries(permissionIds)) {
		const granted = Boolean(permissionId && policyId) && await grant(api, authz, permissionId, policyId, apply);
		console.log(`${label}: ${granted ? "granted" : "missing"} to ${REQUESTER_CLIENT}`);
		missing += granted ? 0 : 1;
	}
	process.exitCode = missing ? 1 : 0;
}

await main();
