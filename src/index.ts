import fs from "node:fs";
import path from "node:path";
import mri from "mri";
import * as prompts from "@clack/prompts";
import { HELP_MESSAGE, PRETTIER_PLUGINS } from "./utils.ts";

// Arguments from cli
const args = mri<{
	prettier?: string;
	eslint?: string;
	stylelint?: string;
	husky?: boolean;
	help?: boolean;
	interactive?: boolean;
}>(process.argv.slice(2), {
	string: ["prettier", "eslint", "stylelint"],
	boolean: ["husky", "interactive", "help"],
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

	let eslintOption = parseToolingOption(args.eslint);
	// No ESLint plugins/values yet — any supplied value just means "enable" (remove once added).
	if (typeof eslintOption === "string" || Array.isArray(eslintOption)) {
		eslintOption = true;
	}
	if (eslintOption === undefined && isInteractive) {
		const result = await prompts.confirm({
			message: "Add ESLint?",
		});
		if (prompts.isCancel(result)) {
			return prompts.cancel("Operation cancelled");
		}
		eslintOption = result;
	}
	console.log(eslintOption);

	let stylelintOption = parseToolingOption(args.stylelint);
	// No Stylelint plugins/values yet — any supplied value just means "enable" (remove once added).
	if (typeof stylelintOption === "string" || Array.isArray(stylelintOption)) {
		stylelintOption = true;
	}
	if (stylelintOption === undefined && isInteractive) {
		const result = await prompts.confirm({
			message: "Add Stylelint?",
		});
		if (prompts.isCancel(result)) {
			return prompts.cancel("Operation cancelled");
		}
		stylelintOption = result;
	}
	console.log(stylelintOption);

	const cwd = process.cwd();

	// add more utils functions to handle file writing, etc.

	function createConfigFile(name: string, value: string) {
		const file = path.join(cwd, name);
		fs.writeFileSync(file, value);
	}

	// rest of the stuff
	if (args.husky) {
		createConfigFile("love cli's", "aboba");
	}
}

init().catch((e) => {
	console.error(e);
});
