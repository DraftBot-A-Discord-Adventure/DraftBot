import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {existsSync} from "node:fs";

const folderPath = `${__dirname}/../../../../Lib/src`; // Directory containing TypeScript files

const parentTypes = new Map<string, string>();
const typeHasDecorator = new Map<string, boolean>();

function checkForDecorators(filePath: string): void {
	const sourceCode = fs.readFileSync(filePath, "utf8");
	const sourceFile = ts.createSourceFile(filePath, sourceCode, ts.ScriptTarget.ESNext, true);

	function visit(node: ts.Node): void {
		if (ts.isClassDeclaration(node) && node.heritageClauses) {
			// eslint-disable-next-line
			parentTypes.set(node.name!.escapedText.toString(), (node.heritageClauses[0].types[0].expression as any).escapedText as string);
			// eslint-disable-next-line
			if (node.modifiers && node.modifiers.length > 0 && node.modifiers.some(modifier => (modifier as any)?.expression?.expression?.escapedText === "sendablePacket")) {
				typeHasDecorator.set(node.name!.escapedText.toString(), true);
			}
			else {
				typeHasDecorator.set(node.name!.escapedText.toString(), false);
			}
		}
		ts.forEachChild(node, visit);
	}

	visit(sourceFile);
}

function walkDirectory(dir: string): void {
	fs.readdirSync(dir).forEach(file => {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			walkDirectory(fullPath);
		}
		else if (fullPath.endsWith(".ts")) {
			checkForDecorators(fullPath);
		}
	});
}

function isDraftBotPacket(packetName: string): boolean {
	if (parentTypes.has(packetName)) {
		return isDraftBotPacket(parentTypes.get(packetName)!);
	}

	return packetName === "DraftBotPacket";
}

// Try only if we are in a dev environment
if (existsSync(folderPath)) {
	walkDirectory(folderPath);

	let error = false;
	for (const packet of parentTypes.keys()) {
		if (isDraftBotPacket(packet) && !typeHasDecorator.get(packet)) {
			console.error(`Packet decorator missing on packet: ${packet}`);
			error = true;
		}
	}

	if (error) {
		process.exit(1);
	}

	console.log("All packets decorators OK");
}
