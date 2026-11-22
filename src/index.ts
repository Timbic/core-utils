import fs from "node:fs";
import path from "node:path";
import mri from "mri";

const HELP_MESSAGE = `Help me!!!`;

const cwd = process.cwd();

// add more utils functions to handle file writing, etc.

function createConfigFile(name: string, value: string) {
	const file = path.join(cwd, name);
	fs.writeFileSync(file, value);
}

const args = mri<{
	prettier?: string;
	eslint?: string;
	stylelint?: string;
	husky?: string;
	help?: boolean;
	interactive?: boolean;
}>(process.argv.slice(2), {
	string: ["prettier", "eslint", "stylelint", "husky"],
	boolean: ["interactive", "help"],
	alias: { h: "help" },
});

async function init() {
	if (args.help) {
		console.log(HELP_MESSAGE);
		return;
	}

	const isInteractive = args.interactive ?? process.stdin.isTTY;

	if (isInteractive) {
		// use @clack/prompts
	}

	if (args.prettier) {
		// handle prettier
		createConfigFile("prettier", "i love prettier");
	}

	if (args.eslint) {
		// handle eslint
	}

	if (args.stylelint) {
		// handle stylelint
	}

	if (args.husky) {
		// handle husky and lint-staged
	}

	// rest of the stuff
}

init().catch((e) => {
	console.error(e);
});
