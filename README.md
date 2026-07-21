# ProPresenter Presentation Builder

Generate a ProPresenter `.pro` file from structured JSON.

The MVP builds a fresh presentation from TypeScript protobuf builders and built-in layouts.

## Requirements

- Node.js 20 or newer
- pnpm

Install dependencies:

```bash
pnpm install
```

## Generate A Presentation

Run:

```bash
pnpm generate -- --input input.json --output output.pro
```

Set a custom presentation title:

```bash
pnpm generate -- --input input.json --output output.pro --title "Sunday Service"
```

Write a decoded JSON debug file next to the output:

```bash
pnpm generate -- --input input.json --output output.pro --debug-decode
```

This creates:

- `output.pro`
- `output.pro.decode.json` when `--debug-decode` is used

Generated `.pro` and decode files are ignored by git.

## Input JSON Format

The input file is an array of slides.

```json
[
  {
    "label": "Title",
    "text": {
      "label": "Title",
      "text": "The Great Gatsby"
    }
  },
  {
    "label": "John 3:16",
    "text": [
      {
        "label": "Reference",
        "text": "John 3:16"
      },
      {
        "label": "Verse",
        "text": "For God so loved the world..."
      }
    ]
  }
]
```

Rules:

- `label` becomes the ProPresenter slide label.
- `text[].label` becomes the ProPresenter text object name.
- `text[].text` becomes the rendered text content.
- `text` should normally be an array.
- For MVP compatibility, a single `text` object is accepted and normalized to a one-item array with a warning.
- Missing or blank slide labels are allowed and generate blank slide labels.

## Layout Behavior

Layouts are built in code from the number of text items on each slide:

- One text item: one large centered text box.
- Two text items: a smaller upper text box and a larger main body text box.
- Three or more text items: stacked text boxes with deterministic spacing.

## Inspect The Template

Use the inspection command to view the decoded structure of `Template.pro`:

```bash
pnpm inspect-template -- --template Template.pro
```

The output includes the presentation title, UUID, source ProPresenter version,
and each cue's text objects with font, size, and bounds.

## Validate Output Manually

The CLI decodes every generated file against the real `rv.data.Presentation`
schema before writing it, so invalid protobuf output fails generation. Use
`--debug-decode` to write the decoded presentation as pretty-printed JSON next
to the output file.

## Development

Run tests:

```bash
pnpm test
```

Run TypeScript checks:

```bash
pnpm typecheck
```

Build compiled JavaScript:

```bash
pnpm build
```

The build produces a bundled runtime at:

```bash
dist/cli.js
```

Run the bundled CLI with Node:

```bash
node dist/cli.js generate --input input.json --output output.pro
```

or:

```bash
node dist/cli.js inspect-template --template Template.pro
```

## Proto Schemas

The `proto/rv/` directory vendors reverse-engineered ProPresenter 7 `.proto`
definitions from [greyshirtguy/ProPresenter7-Proto](https://github.com/greyshirtguy/ProPresenter7-Proto)
(see `proto/README.md` for provenance and update instructions).

TypeScript types are generated into `src/generated/` with:

```bash
pnpm proto:gen
```

The test suite uses the generated `rv.data.Presentation` schema to verify that
`Template.pro` round-trips byte-identically and that generator output decodes
against the real schema — a much stronger check than `protoc --decode_raw`.

## Current MVP Limitations

- Slides use a hardcoded Helvetica Neue white centered style.
- Built-in layouts are deterministic defaults, not editable from JSON.
