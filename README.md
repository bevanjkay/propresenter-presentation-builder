# ProPresenter Presentation Builder

Generate a fresh ProPresenter `.pro` file from structured JSON.

The current MVP builds the presentation from TypeScript protobuf builders. `Template.pro` is used only as a reverse-engineering fixture for understanding the ProPresenter file format and for the inspection command. It is not required when generating a presentation.

## Requirements

- Node.js 20 or newer
- pnpm
- `protoc` is recommended for decode validation and debug output

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

Write a decoded protobuf debug file next to the output:

```bash
pnpm generate -- --input input.json --output output.pro --debug-decode
```

This creates:

- `output.pro`
- `output.pro.decode.txt` when `--debug-decode` is used

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

Theme switching and custom per-slide layout configuration are not implemented yet.

## Inspect The Template

Use the inspection command to view the known protobuf structure from `Template.pro`:

```bash
pnpm inspect-template -- --template Template.pro
```

The output includes:

- top-level fields
- presentation title
- cue count
- cue labels
- text object labels
- discovered RTF field paths
- geometry-like field paths
- candidate field constants used by the builders

## Validate Output Manually

If `protoc` is installed, decode the generated file:

```bash
protoc --decode_raw < output.pro
```

The CLI also performs this smoke test automatically during generation when `protoc` is available.

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

## Current MVP Limitations

- The generator does not use `Template.pro` as a runtime base.
- The generated protobuf structure is based on currently discovered field mappings.
- If ProPresenter rejects a generated file, the expected fix is to add missing protobuf fields to the builders.
- Text styling is currently a hardcoded Helvetica Neue white centered style.
- Layouts are deterministic defaults, not editable from JSON.
- Theme switching is planned for later.
