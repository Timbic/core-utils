# @timbic/core-utils

<p>
  <a href="https://www.npmjs.com/package/@timbic/core-utils"><img src="https://img.shields.io/npm/v/@timbic/core-utils.svg?logo=nodedotjs" alt="npm package"></a>
  <a href="https://github.com/Timbic/core-utils"><img src="https://img.shields.io/badge/Github-gray.svg?logo=github" alt="github repo"></a>
  <a href="https://npmx.dev/package/@timbic/core-utils"><img src="https://img.shields.io/badge/npmx.dev-black?logo=npm" alt="view on npmx"></a>
</p>

Timbic's toolkit for TypeScript projects: the shared configs and linting tools in one package, plus a CLI that wires them into an existing
project.

## Usage

```bash
pnpm add -D @timbic/core-utils
```

> **Important:** When using pnpm, don't forget to hoist this tools to the top level in `pnpm-workspace.yaml`:
>
> ```yaml
> publicHoistPattern:
>     - eslint
>     - husky
>     - lint-staged
>     - prettier
>     - stylelint
> ```
>
> Alternatively, install them as dev dependencies:
>
> ```bash
> pnpm add -D eslint husky lint-staged prettier stylelint
> ```

Then run:

```bash
core-utils [DIRECTORY]
```

> You can use `.` for the project directory to scaffold in the current directory.

This will trigger interactive cli to wire up all this tools into the existing project.

## What's included

- [Prettier](https://www.npmjs.com/package/prettier) - Widely used opinionated code formatter.
- [ESLint](https://www.npmjs.com/package/eslint) - Widely used JS/TS linter.
- [Stylelint](https://www.npmjs.com/package/stylelin) - Popular CSS linter.
- [Husky](https://www.npmjs.com/package/husky) - Tool which automatically lint commit messages, code, and run tests upon committing or
  pushing.
- [lint-staged](https://www.npmjs.com/package/lint-staged) - Task-runner for staged git files.

## CLI

```bash
core-utils [DIRECTORY] [OPTIONS]...
```

The target directory must exist and contain a `package.json`. You can also specify the tools to add directly via additional cli options.

```bash
# Scaffold tools inside my-project directory ()
core-utils my-project --prettier=oxc,yaml --husky

# Also can be used without installing

# Scaffold tools inside current directory
pnx core-utils . --eslint --stylelint --husky
```

## Options

| Option                 | Description                 |
| ---------------------- | --------------------------- |
| `-h`, `--help`         | Display the help message.   |
| `-i`, `--interactive`  | Force interactive mode.     |
| `--prettier [PLUGINS]` | Add a Prettier config.      |
| `--eslint`             | Add an ESLint config.       |
| `--stylelint`          | Add a Stylelint config.     |
| `--husky`              | Set up Husky + lint-staged. |

## License

Released under the [MIT License](./LICENSE).
