import { styleText } from "node:util";
import type { TimbicOptions } from "@timbic/prettier-config";

// Colors for text formatting
type ColorName = Exclude<Parameters<typeof styleText>[0], readonly unknown[]>;

function createColors() {
	return new Proxy({} as Record<ColorName, (text: string) => string>, {
		get(_, prop) {
			return (text: string) => styleText(prop as ColorName, text);
		},
	});
}

const COLORS = createColors();

type Plugin = { name: keyof TimbicOptions; color: (str: string) => string };

const PLUGIN_COLORS = {
	oxc: COLORS.yellow,
	tailwind: COLORS.cyan,
	astro: COLORS.magenta,
	yaml: COLORS.green,
} satisfies Record<keyof TimbicOptions, (str: string) => string>;

const PRETTIER_PLUGINS: Plugin[] = Object.entries(PLUGIN_COLORS).map(([name, color]) => ({
	name: name as keyof TimbicOptions,
	color,
}));

// Message for help argument
function getPluginList(): string {
	return PRETTIER_PLUGINS.map((plugin) => `  ${plugin.color(plugin.name.padEnd(10))}`).join("\n");
}

const HELP_MESSAGE = `\
Usage: core-utils [OPTION]... [DIRECTORY]

Configure Prettier, ESLint, Stylelint and Husky + lint-staged in an existing Node.js project.
The target directory must already exist and contain a package.json.
When running in a TTY, the CLI will start in interactive mode.

Options:
  -h, --help                            display this help message
  -i, --interactive                     force interactive / non-interactive mode
  --prettier [PLUGINS]                  add a Prettier config (comma-separated plugins)
  --eslint                              add an ESLint config
  --stylelint                           add a Stylelint config
  --husky                               add Husky + lint-staged

Available Prettier plugins (omit the value to pick interactively):
${getPluginList()}
`;

export { COLORS, PRETTIER_PLUGINS, HELP_MESSAGE };
