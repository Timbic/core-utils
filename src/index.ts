import fs from "node:fs";
import path from "node:path";
import mri from "mri";
import * as prompts from "@clack/prompts";

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

	// mri gives string flags "" when they have no value.
	function parseTemplateOption(value?: string): boolean | string | string[] | undefined {
		if (value === undefined || typeof value === "boolean") return value;
		if (value === "") return true;
		if (value === "true") return true;
		if (value === "false") return false;
		return value.includes(",") ? value.split(",") : value;
	}

	let prettierOption = parseTemplateOption(args.prettier);
	if (prettierOption === true) {
		if (isInteractive) {
			const result = await prompts.multiselect({
				message: "Select plugins to include:",
				options: [{ value: "oxc" }, { value: "tailwind" }],
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

	const eslintOption = parseTemplateOption(args.eslint);
	if (eslintOption) {
		// handle eslint
	}

	const stylelintOption = parseTemplateOption(args.stylelint);
	if (stylelintOption) {
		// handle stylelint
	}

	const huskyOption = parseTemplateOption(args.husky);
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
