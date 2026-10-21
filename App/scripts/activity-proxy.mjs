// Serves the web build as Discord loads it, for a Discord Activity developed against local services.
//
// Discord's proxy only forwards an Activity to the hosts declared in its URL mappings. Pointing the single
// "/" mapping at a tunnel to this server spares one tunnel per service: it serves the static export and
// forwards the Activity routes of src/activity/ActivityRoutes.ts to the services, WebSockets included.
//
//   node scripts/activity-proxy.mjs [--port 10510] [--static dist-activity] [--route /prefix=http://host:port ...]
//
// The default routes match the local services; a --route replaces the default of the same prefix.
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { connect as netConnect } from "node:net";
import { connect as tlsConnect } from "node:tls";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";

const DEFAULT_ROUTES = {
	"/api": "http://127.0.0.1:10500",
	"/ws": "http://127.0.0.1:10501",
	"/cdn": "https://cdn.jsdelivr.net"
};

const CONTENT_TYPES = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".json": "application/json",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".ttf": "font/ttf",
	".otf": "font/otf",
	".woff2": "font/woff2",
	".wasm": "application/wasm"
};

/** Headers describing the hop rather than the message: each side of the proxy sets its own. */
const HOP_HEADERS = new Set(["host", "connection", "keep-alive", "transfer-encoding", "upgrade", "proxy-connection"]);

function options() {
	const args = process.argv.slice(2);
	const settings = {port: 10510, staticDir: "dist-activity", routes: {...DEFAULT_ROUTES}};
	for (let index = 0; index < args.length; index += 2) {
		const [flag, value] = [args[index], args[index + 1]];
		if (value === undefined) throw new Error(`Missing value after ${flag}`);
		if (flag === "--port") settings.port = Number(value);
		else if (flag === "--static") settings.staticDir = value;
		else if (flag === "--route") {
			const separator = value.indexOf("=");
			if (separator <= 0) throw new Error(`A route is written /prefix=target, not ${value}`);
			settings.routes[value.slice(0, separator)] = value.slice(separator + 1);
		}
		else throw new Error(`Unknown option ${flag}`);
	}
	// The longest prefix wins, so /api/x can be sent elsewhere than /api.
	settings.routes = Object.entries(settings.routes)
		.sort(([first], [second]) => second.length - first.length)
		.map(([prefix, target]) => ({prefix, target: new URL(target)}));
	settings.staticDir = resolve(settings.staticDir);
	return settings;
}

function routeOf(routes, url) {
	const path = url.split("?")[0];
	const route = routes.find(({prefix}) => path === prefix || path.startsWith(`${prefix}/`));
	if (!route) return null;
	const rest = url.slice(route.prefix.length);
	const basePath = route.target.pathname.replace(/\/$/u, "");
	return {target: route.target, path: `${basePath}${rest.startsWith("/") ? rest : `/${rest}`}`};
}

function forwardedHeaders(headers, target) {
	const kept = Object.fromEntries(Object.entries(headers).filter(([name]) => !HOP_HEADERS.has(name)));
	return {...kept, host: target.host};
}

function forward(req, res, {target, path}) {
	const send = target.protocol === "https:" ? httpsRequest : httpRequest;
	const outgoing = send({
		protocol: target.protocol,
		hostname: target.hostname,
		port: target.port,
		method: req.method,
		path,
		headers: forwardedHeaders(req.headers, target)
	}, answer => {
		const headers = Object.fromEntries(Object.entries(answer.headers).filter(([name]) => !HOP_HEADERS.has(name)));
		res.writeHead(answer.statusCode ?? 502, headers);
		answer.pipe(res);
	});
	outgoing.on("error", error => {
		console.warn(`${req.method} ${req.url} -> ${target.origin}${path}: ${error.message}`);
		if (!res.headersSent) res.writeHead(502);
		res.end();
	});
	req.pipe(outgoing);
}

function forwardUpgrade(req, socket, head, {target, path}) {
	const secure = target.protocol === "https:" || target.protocol === "wss:";
	const port = Number(target.port) || (secure ? 443 : 80);
	const upstream = secure
		? tlsConnect({host: target.hostname, port, servername: target.hostname})
		: netConnect({host: target.hostname, port});
	upstream.on(secure ? "secureConnect" : "connect", () => {
		const headers = {...Object.fromEntries(Object.entries(req.headers).filter(([name]) => name !== "host")), host: target.host};
		const lines = [`${req.method} ${path} HTTP/1.1`, ...Object.entries(headers).flatMap(([name, value]) => [].concat(value).map(item => `${name}: ${item}`))];
		upstream.write(`${lines.join("\r\n")}\r\n\r\n`);
		if (head.length) upstream.write(head);
		upstream.pipe(socket);
		socket.pipe(upstream);
	});
	const close = error => {
		if (error) console.warn(`WebSocket ${req.url} -> ${target.origin}${path}: ${error.message}`);
		socket.destroy();
		upstream.destroy();
	};
	upstream.on("error", close);
	socket.on("error", close);
}

async function fileOf(staticDir, url) {
	const path = normalize(decodeURIComponent(url.split("?")[0]));
	const candidates = [join(staticDir, path), join(staticDir, `${path}.html`), join(staticDir, path, "index.html")];
	for (const candidate of candidates) {
		if (!candidate.startsWith(staticDir)) continue;
		const found = await stat(candidate).catch(() => null);
		if (found?.isFile()) return candidate;
	}
	// The router draws any other address itself once the page is loaded.
	return join(staticDir, "index.html");
}

async function serveStatic(staticDir, req, res) {
	const file = await fileOf(staticDir, req.url ?? "/");
	const type = CONTENT_TYPES[extname(file)] ?? "application/octet-stream";
	res.writeHead(200, {
		"Content-Type": type,
		// Discord's proxy drops the caching headers of HTML only: the hashed bundles may be kept.
		"Cache-Control": type.startsWith("text/html") ? "no-cache" : "public, max-age=31536000, immutable"
	});
	createReadStream(file).on("error", () => res.end()).pipe(res);
}

const settings = options();
const server = createServer((req, res) => {
	const route = routeOf(settings.routes, req.url ?? "/");
	if (route) {
		forward(req, res, route);
		return;
	}
	serveStatic(settings.staticDir, req, res).catch(error => {
		console.warn(`${req.url}: ${error.message}`);
		res.writeHead(500);
		res.end();
	});
});
server.on("upgrade", (req, socket, head) => {
	const route = routeOf(settings.routes, req.url ?? "/");
	if (!route) {
		socket.destroy();
		return;
	}
	forwardUpgrade(req, socket, head, route);
});
server.listen(settings.port, () => {
	console.log(`Activity served on http://localhost:${settings.port} from ${settings.staticDir}`);
	for (const {prefix, target} of settings.routes) console.log(`  ${prefix} -> ${target.href}`);
});
