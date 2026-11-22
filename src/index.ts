import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const HELP_MESSAGE = `Help me!!!`;

const cwd = process.cwd();

// add more utils functions to handle file writing, etc.

function createConfigFile(name: string, value: string) {
	const file = path.join(cwd, name);
	fs.writeFileSync(file, value);
}

async function init() {
	// replace with mri
	const args = parseArgs();

	if (args.values.help) {
		console.log(HELP_MESSAGE);
		return;
	}

	if (args.values.interactive) {
		// work in interactive mode (@clack/prompts)
	}

	if (args.values.prettier) {
		// handle prettier
		createConfigFile("prettier", "i love prettier");
	}

	if (args.values.eslint) {
		// handle eslint
	}

	if (args.values.stylelint) {
		// handle stylelint
	}

	if (args.values.husky) {
		// handle husky and lint-staged
	}

	// rest of the stuff
}

init().catch((err) => {
	console.log(err);
});
