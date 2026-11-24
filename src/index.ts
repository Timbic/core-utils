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
	if (args.help) return console.log(HELP_MESSAGE);

	const isInteractive = args.interactive ?? process.stdin.isTTY;

	function cancel() {
		return prompts.cancel("Operation cancelled");
	}

	async function ask(message: string) {
		const result = await prompts.confirm({ message });
		return prompts.isCancel(result) ? cancel() : result;
	}

	// 1. Get target dir
	function formatTargetDir(targetDir: string) {
		return targetDir
			.trim()
			.replace(/[<>:"\\|?*]/g, "")
			.replace(/\/+$/g, "");
	}

	let targetDir = formatTargetDir(String(args._[0] ?? ""));
	if (!fs.existsSync(targetDir)) {
		if (!isInteractive) {
			prompts.log.error(`Target directory "${targetDir}" does not exist.`);
			return;
		}
		const result = await prompts.text({
			message: "Target directory",
			defaultValue: ".",
			placeholder: ".",
			validate: (value) => (value && fs.existsSync(formatTargetDir(value)) ? undefined : "Directory does not exist"),
		});
		if (prompts.isCancel(result)) return cancel();
		targetDir = formatTargetDir(result);
	}

	// 2. Check if it has package.json
	const cwd = process.cwd();
	const root = path.resolve(cwd, targetDir);
	const packageJsonPath = path.join(root, "package.json");
	if (!fs.existsSync(packageJsonPath)) {
		prompts.log.error(`"${root}" is not a Node.js project (no package.json found).`);
		return;
	}

	// 3. Parse and select options for prettier, eslint and stylelint

	// mri gives string flags "" when they have no value.
	function parseToolingOption(value?: string) {
		if (value === undefined) return value;
		if (value === "" || value === "true") return true;
		if (value === "false") return false;
		return value.includes(",") ? value.split(",") : [value];
	}

	let prettierOption = parseToolingOption(args.prettier);

	const names: string[] = PRETTIER_PLUGINS.map((plugin) => plugin.name);
	const requested = [prettierOption].flat().filter((value): value is string => typeof value === "string");
	const invalidPlugins = requested.filter((name) => !names.includes(name));

	if (invalidPlugins.length) {
		prompts.log.warn(`"${invalidPlugins.join(", ")}" isn't a valid Prettier plugin.`);
		prettierOption = true;
	}

	if (prettierOption === undefined && isInteractive) {
		const result = await ask("Add Prettier?");
		if (result === undefined) return;
		prettierOption = result;
	}

	if (prettierOption === true && isInteractive) {
		const result = await prompts.multiselect({
			message: "Select plugins to include:",
			options: PRETTIER_PLUGINS.map((plugin) => ({ value: plugin.name, label: plugin.color(plugin.name) })),
			required: false,
		});
		if (prompts.isCancel(result)) return cancel();
		prettierOption = result;
	}

	let eslintOption = parseToolingOption(args.eslint);
	// No ESLint plugins/values yet — any supplied value just means "enable" (remove once added).
	if (Array.isArray(eslintOption)) eslintOption = true;

	if (eslintOption === undefined && isInteractive) {
		const result = await ask("Add ESLint?");
		if (result === undefined) return;
		eslintOption = result;
	}

	let stylelintOption = parseToolingOption(args.stylelint);
	// No Stylelint plugins/values yet — any supplied value just means "enable" (remove once added).
	if (Array.isArray(stylelintOption)) stylelintOption = true;

	if (stylelintOption === undefined && isInteractive) {
		const result = await ask("Add Stylelint?");
		if (result === undefined) return;
		stylelintOption = result;
	}

	// 4. Select option for Husky + lint-staged

	let huskyOption = args.husky;
	if (huskyOption === undefined && isInteractive) {
		const result = await ask("Add Husky + lint-staged?");
		if (result === undefined) return;
		huskyOption = result;
	}

	// 5. Create the files
	prompts.log.step(`Scaffolding instruments in ${root}...`);

	function createConfigFile(name: string, value: string) {
		const file = path.join(root, name);
		fs.writeFileSync(file, value);
	}

	function writeConfig(name: string, options = "") {
		const config = `import withTimbic from "@timbic/${name}-config";\n\nexport default withTimbic(${options});\n`;
		createConfigFile(`${name}.config.ts`, config);
	}

	if (prettierOption) {
		const plugins = Array.isArray(prettierOption) ? prettierOption : [];
		const options = plugins.length ? `{}, { ${plugins.map((name) => `${name}: true`).join(", ")} }` : "";
		writeConfig("prettier", options);
	}

	if (eslintOption) writeConfig("eslint");

	if (stylelintOption) writeConfig("stylelint");

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
			const packageJsonText = fs.readFileSync(packageJsonPath, "utf8");
			const packageJson = JSON.parse(packageJsonText) as Record<string, unknown>;
			packageJson["lint-staged"] = lintStaged;
			const indent = /\t/.test(packageJsonText) ? "\t" : 2;
			fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, indent)}\n`);
		}
	}
}

init().catch((e) => {
	console.error(e);
});
