#!/usr/bin/env npx tsx
/**
 * @file src/cli.ts
 * @description CLI entrypoint for karel-testgen. Provides the `generate` command
 *   that compiles a Karel solution and runs it against .in world files to produce
 *   .out outputs.
 */

import { Command } from "commander";
import chalk from "chalk";
import path from "path";
import fs from "fs/promises";
import { generate } from "./runner.js";

const program = new Command();

program
  .name("karel-testgen")
  .description(
    "CLI tool to generate Karel test case outputs (.out) from solutions and input worlds (.in)"
  )
  .version("1.0.0");

program
  .command("generate")
  .description("Run a Karel solution against .in files and produce .out files")
  .requiredOption("-s, --solution <path>", "Path to the .kp or .kj solution file")
  .requiredOption("-c, --cases <dir>", "Directory containing .in test case files")
  .option("-o, --output <dir>", "Output directory for .out files (defaults to cases dir)")
  .option("-f, --force", "Overwrite existing .out files", false)
  .action(async (opts) => {
    const solutionPath = path.resolve(opts.solution);
    const casesDir = path.resolve(opts.cases);
    const outputDir = opts.output ? path.resolve(opts.output) : undefined;
    const force = opts.force as boolean;

    // Validate solution file exists
    try {
      await fs.access(solutionPath);
    } catch {
      console.error(chalk.red(`✗ Solution file not found: ${solutionPath}`));
      process.exit(1);
    }

    // Validate cases directory exists
    try {
      const stat = await fs.stat(casesDir);
      if (!stat.isDirectory()) {
        console.error(chalk.red(`✗ Cases path is not a directory: ${casesDir}`));
        process.exit(1);
      }
    } catch {
      console.error(chalk.red(`✗ Cases directory not found: ${casesDir}`));
      process.exit(1);
    }

    console.log(chalk.bold("\n🤖 karel-testgen\n"));
    console.log(`  Solution:  ${chalk.cyan(path.basename(solutionPath))}`);
    console.log(`  Cases:     ${chalk.cyan(casesDir)}`);
    if (outputDir) {
      console.log(`  Output:    ${chalk.cyan(outputDir)}`);
    }
    console.log(`  Force:     ${force ? chalk.yellow("yes") : "no"}`);
    console.log();

    try {
      // Compile + run
      console.log(chalk.dim("Compiling solution..."));
      const results = await generate({
        solutionPath,
        casesDir,
        outputDir,
        force,
      });

      // Print results
      let okCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (const r of results) {
        if (r.status === "ok") {
          okCount++;
          console.log(
            chalk.green(`  ✓ ${r.name}.in → ${r.name}.out`)
          );
        } else if (r.status === "skipped") {
          skipCount++;
          console.log(
            chalk.yellow(`  ⊘ ${r.name}.in → skipped (${r.message})`)
          );
        } else {
          errorCount++;
          console.log(
            chalk.red(`  ✗ ${r.name}.in → error: ${r.message}`)
          );
        }
      }

      // Summary
      console.log(chalk.bold("\n─── Summary ───"));
      console.log(
        `  ${chalk.green(`${okCount} generated`)}` +
          (skipCount > 0 ? `  ${chalk.yellow(`${skipCount} skipped`)}` : "") +
          (errorCount > 0 ? `  ${chalk.red(`${errorCount} errors`)}` : "")
      );
      console.log();

      if (errorCount > 0) {
        process.exit(1);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`\n✗ ${msg}\n`));
      process.exit(1);
    }
  });

program.parse();
