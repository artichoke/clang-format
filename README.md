# intaglio

[![GitHub Actions](https://github.com/artichoke/clang-format/workflows/CI/badge.svg)](https://github.com/artichoke/clang-format/actions)
[![Discord](https://img.shields.io/discord/607683947496734760)](https://discord.gg/QCe2tp2)
[![Twitter](https://img.shields.io/twitter/follow/artichokeruby?label=Follow&style=social)](https://twitter.com/artichokeruby)

`clang-format` runner that operates recursively on a given directory and has
output suitable for use in CI and interactive development.

`clang-format` does not have a pleasant way to output which files are not
properly formatted, which is not suitable for CI or code linting. Prior art to
address this limitation exists in [Sarcasm/run-clang-format].

The Artichoke `clang-format` runner does not require Python or an existing
`clang` installation. This runner is simpler to distribute because it is
invokable with [`npx`].

The Artichoke `clang-format` runner is used to format C sources in the
[artichoke/artichoke] repository. It will never be published to the npm
registry.

## Usage

```shell
npx github:artichoke/clang-format path/to/repo
```

## License

The Artichoke `clang-format` runner is licensed under the [MIT License](LICENSE)
(c) Ryan Lopopolo.

[Sarcasm/run-clang-format]: https://github.com/Sarcasm/run-clang-format
[`npx`]: https://blog.npmjs.org/post/162869356040/introducing-npx-an-npm-package-runner
[artichoke/artichoke]: https://github.com/artichoke/artichoke
