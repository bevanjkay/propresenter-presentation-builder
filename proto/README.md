# Vendored ProPresenter 7 Proto Definitions

The `rv/` directory contains reverse-engineered `.proto` files for ProPresenter 7,
vendored from [greyshirtguy/ProPresenter7-Proto](https://github.com/greyshirtguy/ProPresenter7-Proto)
(`autogen-proto/`, commit `1b63dda196eb7e079721a8a4a7e7773520cb5ad2`, 2026-06-30).

Only the transitive import closure of `presentation.proto` is vendored — the set of
messages needed to read and write `.pro` presentation files (`rv.data.Presentation`).

These definitions are unofficial and unsupported by Renewed Vision. They are MIT
licensed; see `rv/LICENSE`.

To update: re-copy `presentation.proto` and its imports from the upstream
`autogen-proto/` directory, then run `pnpm proto:gen`.
