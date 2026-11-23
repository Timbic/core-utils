import cp from "node:child_process";
import fs from "node:fs";
import url from "node:url";
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
	function parseToolingOption(value?: string) {
		if (value === undefined || typeof value === "boolean") return value;
		if (value === "") return true;
		if (value === "true") return true;
		if (value === "false") return false;
		return value.includes(",") ? value.split(",") : [value];
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
	}
	console.log(prettierOption);

	let eslintOption = parseToolingOption(args.eslint);
	// No ESLint plugins/values yet — any supplied value just means "enable" (remove once added).
	if (Array.isArray(eslintOption)) eslintOption = true;

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
	if (Array.isArray(stylelintOption)) stylelintOption = true;

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

	let huskyOption = args.husky;
	if (huskyOption === undefined && isInteractive) {
		const result = await prompts.confirm({
			message: "Add Husky + lint-staged?",
		});
		if (prompts.isCancel(result)) {
			return prompts.cancel("Operation cancelled");
		}
		huskyOption = result;
	}
	console.log(huskyOption);

	const targetDir = "custom-test";

	// writing files

	const cwd = process.cwd();
	const root = path.join(cwd, targetDir);
	fs.mkdirSync(root, { recursive: true });

	const packageJsonPath = path.join(root, "package.json");
	const initialPackageJson = { name: targetDir, version: "0.0.0", private: true };
	fs.writeFileSync(packageJsonPath, `${JSON.stringify(initialPackageJson, null, "\t")}\n`);

	prompts.log.step(`Scaffolding instruments in ${root}...`);

	function createConfigFile(name: string, value: string) {
		const file = path.join(root, name);
		fs.writeFileSync(file, value);
	}

	if (prettierOption) {
		const configOptions =
			prettierOption === true || prettierOption.length === 0
				? ""
				: `{}, { ${prettierOption.map((name) => `${name}: true`).join(", ")} }`;
		const prettierConfig = `import withTimbic from "@timbic/prettier-config";\n\nexport default withTimbic(${configOptions});\n`;

		createConfigFile("prettier.config.ts", prettierConfig);
	}

	if (eslintOption) {
		const eslintConfig = `import withTimbic from "@timbic/eslint-config";\n\nexport default withTimbic();\n`;

		createConfigFile("eslint.config.ts", eslintConfig);
	}

	if (stylelintOption) {
		const stylelintConfig = `import withTimbic from "@timbic/stylelint-config";\n\nexport default withTimbic();\n`;

		createConfigFile("stylelint.config.ts", stylelintConfig);
	}

	// add more utils functions to handle file writing, etc.

	// rest of the stuff
	if (huskyOption) {
		const huskyBin = url.fileURLToPath(new URL("bin.js", import.meta.resolve("husky")));
		cp.execFileSync(process.execPath, [huskyBin, "init"], { cwd: root, stdio: "inherit" });

		const huskyDir = path.join(root, ".husky");
		fs.mkdirSync(huskyDir, { recursive: true });
		fs.writeFileSync(path.join(huskyDir, "pre-commit"), "lint-staged\n", { mode: 0o755 });

		const pluginExtensions: Record<string, string[]> = { yaml: ["yaml", "yml"], astro: ["astro"] };
		const extensions = new Set(["js", "ts", "md", "json"]);
		if (Array.isArray(prettierOption)) {
			for (const plugin of prettierOption) pluginExtensions[plugin]?.forEach((ext) => extensions.add(ext));
		}

		const lintStaged: Record<string, string[]> = {
			...(prettierOption ? { [`*.{${[...extensions].join(",")}}`]: ["prettier --write"] } : {}),
			...(eslintOption ? { "*.{js,ts}": ["eslint --fix"] } : {}),
			...(stylelintOption ? { "*.{css,vue}": ["stylelint --fix"] } : {}),
		};

		if (Object.keys(lintStaged).length) {
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as Record<string, unknown>;
			packageJson["lint-staged"] = lintStaged;
			fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, "\t")}\n`);
		}
	}
}

init().catch((e) => {
	console.error(e);
});
