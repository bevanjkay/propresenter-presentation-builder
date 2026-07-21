#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fromBinary, toJsonString } from "@bufbuild/protobuf";
import { Command } from "commander";
import { PresentationSchema } from "./generated/presentation_pb.js";
import { parsePresentationInput } from "./inputSchema.js";
import { buildPresentation } from "./propresenter/buildPresentation.js";
import { createPresentationModel } from "./propresenter/createModel.js";
import { formatInspection, inspectTemplate } from "./propresenter/inspectTemplate.js";

const program = new Command();

program
  .name("pro-presenter-builder")
  .description("Generate ProPresenter .pro files from structured JSON")
  .version("0.1.0");

program
  .command("generate")
  .requiredOption("--input <path>", "Input JSON path")
  .requiredOption("--output <path>", "Output .pro path")
  .option("--title <title>", "Presentation title", "Generated Presentation")
  .option("--debug-decode", "Write the decoded presentation as JSON next to the generated file")
  .action((options: { input: string; output: string; title: string; debugDecode?: boolean }) => {
    try {
      const inputPath = resolve(options.input);
      const outputPath = resolve(options.output);
      const rawInput = JSON.parse(readFileSync(inputPath, "utf8"));
      const parsed = parsePresentationInput(rawInput);
      const { model, warnings } = createPresentationModel(parsed.slides, options.title);
      const bytes = buildPresentation(model);
      const decoded = fromBinary(PresentationSchema, bytes);

      mkdirSync(dirname(outputPath), { recursive: true });
      writeFileSync(outputPath, bytes);

      const warningList = [...parsed.warnings, ...warnings];
      for (const warning of warningList) {
        console.warn(`Warning: ${warning}`);
      }

      if (options.debugDecode) {
        const decodePath = `${outputPath}.decode.json`;
        writeFileSync(decodePath, toJsonString(PresentationSchema, decoded, { prettySpaces: 2 }));
        console.log(`Debug decode: ${decodePath}`);
      }

      const textObjectCount = model.slides.reduce((sum, slide) => sum + slide.text.length, 0);
      console.log(`Input slides: ${model.slides.length}`);
      console.log(`Generated text objects: ${textObjectCount}`);
      console.log(`Output: ${outputPath}`);
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program
  .command("inspect-template")
  .requiredOption("--template <path>", "Template .pro path")
  .action((options: { template: string }) => {
    try {
      const templatePath = resolve(options.template);
      const bytes = readFileSync(templatePath);
      console.log(formatInspection(inspectTemplate(bytes)));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    }
  });

program.parse(process.argv.filter((arg, index) => index <= 1 || arg !== "--"));
