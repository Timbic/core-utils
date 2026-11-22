import fs from "node:fs";
import path from "node:path";
import mri from "mri";
import * as prompts from "@clack/prompts";
import { PRETTIER_PLUGINS } from "./utils.ts";

const HELP_MESSAGE = `Help me!!!`;

const cwd = process.cwd();

// add more utils functions to handle file writing, etc.

function createConfigFile(name: string, value: string) {
	const file = path.join(cwd, name);
	fs.writeFileSync(file, value);
}

// Arguments from cli
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

// Main function
async function init() {
	if (args.help) {
		console.log(HELP_MESSAGE);
		return;
	}

	const isInteractive = args.interactive ?? process.stdin.isTTY;

	// mri gives string flags "" when they have no value.
	function parseToolingOption(value?: string): boolean | string | string[] | undefined {
		if (value === undefined || typeof value === "boolean") return value;
		if (value === "") return true;
		if (value === "true") return true;
		if (value === "false") return false;
		return value.includes(",") ? value.split(",") : value;
	}

	let prettierOption = parseToolingOption(args.prettier);

	const names: string[] = PRETTIER_PLUGINS.map((plugin) => plugin.name);
	const requested = [prettierOption].flat().filter((value): value is string => typeof value === "string");
	const invalidPlugins = requested.filter((name) => !names.includes(name));

	if (invalidPlugins.length > 0) {
		prompts.log.warn(`"${invalidPlugins.join(", ")}" isn't a valid Prettier plugin.`);
		prettierOption = true;
	}

	if (prettierOption === undefined && isInteractive) {
		const result = await prompts.confirm({
			message: "Add Prettier?",
		});
		if (prompts.isCancel(result)) {
			return prompts.cancel("Operation cancelled");
		}
		prettierOption = result;
	}

	if (prettierOption === true) {
		if (isInteractive) {
			const result = await prompts.multiselect({
				message: "Select plugins to include:",
				options: PRETTIER_PLUGINS.map((plugin) => ({ value: plugin.name, label: plugin.color(plugin.name) })),
				required: false,
			});
			if (prompts.isCancel(result)) {
				return prompts.cancel("Operation cancelled");
			}
			prettierOption = result;
		}
	} else if (prettierOption) {
		prettierOption = Array.isArray(prettierOption) ? prettierOption : [prettierOption];
	}
	console.log(prettierOption);

	const eslintOption = parseToolingOption(args.eslint);
	if (eslintOption) {
		// handle eslint
	}

	const stylelintOption = parseToolingOption(args.stylelint);
	if (stylelintOption) {
		// handle stylelint
	}

	const huskyOption = parseToolingOption(args.husky);
	if (huskyOption) {
		// handle husky and lint-staged
	}

	// rest of the stuff
	if (huskyOption) {
		createConfigFile("love cli's", "aboba");
	}
}

init().catch((e) => {
	console.error(e);
});
