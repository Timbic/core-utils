import util from "node:util";
import type { TimbicOptions } from "@timbic/prettier-config";

// Colors for text formatting
type ColorName = Exclude<Parameters<typeof util.styleText>[0], readonly unknown[]>;

function createColors() {
	return new Proxy({} as Record<ColorName, (text: string) => string>, {
		get(_, prop) {
			return (text: string) => util.styleText(prop as ColorName, text);
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

export { COLORS, PRETTIER_PLUGINS };
