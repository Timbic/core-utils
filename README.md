# @timbic/core-utils

<p>
  <a href="https://www.npmjs.com/package/@timbic/core-utils"><img src="https://img.shields.io/npm/v/@timbic/core-utils.svg?logo=nodedotjs" alt="npm package"></a>
  <a href="https://github.com/Timbic/core-utils"><img src="https://img.shields.io/badge/Github-gray.svg?logo=github" alt="github repo"></a>
  <a href="https://npmx.dev/package/@timbic/core-utils"><img src="https://img.shields.io/badge/npmx.dev-black?logo=npm" alt="view on npmx"></a>
</p>

Timbic's toolkit for TypeScript projects: the shared configs and linting tools in one package, plus a CLI that wires them into an existing
project.

## What's included

- [`@timbic/prettier-config`](https://github.com/Timbic/prettier-config)
- [`@timbic/eslint-config`](https://github.com/Timbic/eslint-config)
- [`@timbic/stylelint-config`](https://github.com/Timbic/stylelint-config)
- [`husky`](https://github.com/typicode/husky) and [`lint-staged`](https://github.com/okonet/lint-staged)
- `core-utils` — a CLI that sets all of the above up in an existing project

## Installation

```bash
pnpm add -D @timbic/core-utils
```

## CLI

```bash
core-utils <directory> [options]
```

The target directory must exist and contain a `package.json`. Use `.` for the current directory. In a TTY the CLI asks for anything you
didn't pass as a flag.

> The generated configs import the `@timbic/*-config` packages directly, so install this package in the target project (or use the
> equivalent package manager command) to make them resolvable.

### What it does

- Writes `prettier.config.ts`, `eslint.config.ts` and/or `stylelint.config.ts` using the included configs.
- With `--husky`, runs `husky init`, replaces `.husky/pre-commit` with `lint-staged`, adds `"prepare": "husky"` and a `lint-staged` section
  to the existing `package.json` (preserving its indentation).
- Only adds `prettier --write`, `eslint --fix` and `stylelint --fix` to `lint-staged` for tools you enabled.

### Options

| Option                             | Description                                                    |
| ---------------------------------- | -------------------------------------------------------------- |
| `--prettier [PLUGINS]`             | Add a Prettier config. Run `--help` for the available options. |
| `--eslint`                         | Add an ESLint config.                                          |
| `--stylelint`                      | Add a Stylelint config.                                        |
| `--husky / --no-husky`             | Set up Husky + lint-staged.                                    |
| `--interactive / --no-interactive` | Force interactive / non-interactive mode.                      |
| `-h, --help`                       | Display the help message.                                      |

### Examples

```bash
# interactive, current directory
core-utils .

# Prettier + ESLint
core-utils my-app --prettier --eslint

# everything, no prompts
core-utils my-app --prettier --eslint --stylelint --husky --no-interactive
```

You can also run it without installing:

```bash
pnpm dlx @timbic/core-utils my-app --husky
```

## Development

- Install dependencies:

```bash
pnpm install
```

- Build the library:

```bash
pnpm run build
```
