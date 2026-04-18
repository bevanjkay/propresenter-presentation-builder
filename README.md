# ProPresenter Presentation Builder

Generate a ProPresenter `.pro` file from structured JSON.

By default, the MVP builds a fresh presentation from TypeScript protobuf builders and built-in layouts. You can also pass a template presentation and choose template slide layouts per input slide with the `theme` key.

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

Use a template presentation for themed slide layouts:

```bash
pnpm generate -- --input input.json --output output.pro --template Template.pro
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
    "theme": "Bible Verse",
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
- `theme` is required when `--template` is used. It must match a slide label in the template presentation.
- `text[].label` becomes the ProPresenter text object name.
- `text[].text` becomes the rendered text content.
- `text` should normally be an array.
- For MVP compatibility, a single `text` object is accepted and normalized to a one-item array with a warning.
- If `label` is omitted and `theme` is present, the generated slide label defaults to `theme`.
- An explicit blank `label` is allowed and generates a blank slide label.

## Layout Behavior

Without `--template`, layouts are built in code from the number of text items on each slide:

- One text item: one large centered text box.
- Two text items: a smaller upper text box and a larger main body text box.
- Three or more text items: stacked text boxes with deterministic spacing.

With `--template`, every slide must have a `theme` key. The match is made against the ProPresenter slide label in the template presentation. Text objects are matched by exact `text[].label`.

For example, this input slide:

```json
{
  "label": "Opening Quote",
  "theme": "Quote",
  "text": [
    {
      "label": "Subpoint",
      "text": "A.W. Tozer"
    },
    {
      "label": "Description",
      "text": "What comes into our minds when we think about God is the most important thing about us."
    }
  ]
}
```

requires a slide in the template presentation labelled `Quote`, with text objects named exactly `Subpoint` and `Description`.

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

- Template presentations are optional. When used, themed slides preserve the matched template slide structure and replace text by object label.
- The generated protobuf structure is based on currently discovered field mappings.
- If ProPresenter rejects a generated file, the expected fix is to add missing protobuf fields to the builders.
- Built-in fallback slides use a hardcoded Helvetica Neue white centered style.
- Built-in layouts are deterministic defaults, not editable from JSON.
- A themed slide fails generation if the requested template slide label or exact text object label is missing.
