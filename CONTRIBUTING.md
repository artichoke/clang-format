# Contributing to Artichoke – clang-format Runner

👋 Hi and welcome to [Artichoke](https://github.com/artichoke). Thanks for
taking the time to contribute! 💪💎🙌

Artichoke aspires to be a Ruby 2.6.3-compatible implementation of the Ruby
programming language.
[There is lots to do](https://github.com/artichoke/artichoke/issues).

The Artichoke `clang-format` runner is used to lint C sources in development and
CI.

If Artichoke does not run Ruby source code in the same way that MRI does, it is
a bug and we would appreciate if you
[filed an issue so we can fix it](https://github.com/artichoke/artichoke/issues/new).
[File bugs specific to the Artichoke `clang-format` runner in this repository](https://github.com/artichoke/clang-format/issues/new).

If you would like to contribute code to the Artichoke `clang-format` runner
👩‍💻👨‍💻, find an issue that looks interesting and leave a comment that you're
beginning to investigate. If there is no issue, please file one before beginning
to work on a PR.
[Good first issues are labeled `E-easy`](https://github.com/artichoke/clang-format/labels/E-easy).

## Discussion

If you'd like to engage in a discussion outside of GitHub, you can
[join Artichoke's public Discord server](https://discord.gg/QCe2tp2).

## Setup

The Artichoke `clang-format` runner includes JavaScript and Text sources.
Developing on the runner requires configuring several dependencies.

### Node.js

The Artichoke `clang-format` runner is implemented in Node.js, which is required
for running it.

Node.js is an optional dependency that is used for formatting text sources with
[prettier](https://prettier.io/).

Node.js is only required for formatting if modifying the following filetypes:

- `md`
- `yaml`
- `yml`

You will need to install
[Node.js](https://nodejs.org/en/download/package-manager/).

On macOS, you can install Node.js with
[Homebrew](https://docs.brew.sh/Installation):

```sh
brew install node
```

## Linting

```sh
npm run fmt
```

## Updating Dependencies

Regular dependency bumps are handled by [@dependabot](https://dependabot.com/).
