/**
 * @file src/runner.ts
 * @description Core Karel runner — compiles a solution and executes it against
 *   .in world files to produce .out outputs. Uses the same @rekarel/core engine
 *   as the omips-yuc-judge worker for guaranteed identical results.
 */

import { compile, World } from "@rekarel/core";
import { DOMParser } from "@xmldom/xmldom";
import fs from "fs/promises";
import path from "path";

/** Result of running a single test case. */
export interface CaseResult {
  name: string;
  inputFile: string;
  outputFile: string;
  status: "ok" | "skipped" | "error";
  message?: string;
}

/** Options for the generate function. */
export interface GenerateOptions {
  /** Path to the .kp or .kj solution file. */
  solutionPath: string;
  /** Path to the directory containing .in files. */
  casesDir: string;
  /** Where to write the .out files. Defaults to casesDir. */
  outputDir?: string;
  /** Overwrite existing .out files. */
  force?: boolean;
}

/**
 * Compiles a Karel solution and runs it against all .in files in a directory,
 * producing the corresponding .out files.
 *
 * @returns Array of results, one per .in file found.
 */
export async function generate(options: GenerateOptions): Promise<CaseResult[]> {
  const { solutionPath, casesDir, force = false } = options;
  const outputDir = options.outputDir ?? casesDir;

  // 1. Read and compile the solution
  const sourceCode = await fs.readFile(solutionPath, "utf8");

  let program: ReturnType<typeof compile>[0];
  try {
    program = compile(sourceCode, false)[0];
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Compilation error: ${msg}`);
  }

  // 2. Find all .in files
  const allFiles = await fs.readdir(casesDir);
  const inFiles = allFiles.filter((f) => f.endsWith(".in")).sort();

  if (inFiles.length === 0) {
    throw new Error(`No .in files found in ${casesDir}`);
  }

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // 3. Run each test case
  const results: CaseResult[] = [];

  for (const inFile of inFiles) {
    const baseName = inFile.replace(/\.in$/, "");
    const inputPath = path.join(casesDir, inFile);
    const outputPath = path.join(outputDir, `${baseName}.out`);

    // Skip if .out exists and --force not set
    if (!force) {
      try {
        await fs.access(outputPath);
        results.push({
          name: baseName,
          inputFile: inputPath,
          outputFile: outputPath,
          status: "skipped",
          message: ".out already exists (use --force to overwrite)",
        });
        continue;
      } catch {
        // File doesn't exist, proceed
      }
    }

    try {
      // Read the input world XML
      const inputXml = await fs.readFile(inputPath, "utf8");

      // Parse XML and create world
      const xml = new DOMParser().parseFromString(inputXml, "text/xml");
      const world = new World(1, 1);
      world.load(xml as any);

      // Load the compiled program and execute
      const runtime = world.runtime;
      runtime.load(program);

      while (runtime.step()) {
        // Step through the entire execution
      }

      // Check for runtime errors
      if (runtime.state.error) {
        results.push({
          name: baseName,
          inputFile: inputPath,
          outputFile: outputPath,
          status: "error",
          message: `Runtime error: ${runtime.state.error}`,
        });
        continue;
      }

      // Get the output and save it
      const output = world.output();
      await fs.writeFile(outputPath, output, "utf8");

      results.push({
        name: baseName,
        inputFile: inputPath,
        outputFile: outputPath,
        status: "ok",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({
        name: baseName,
        inputFile: inputPath,
        outputFile: outputPath,
        status: "error",
        message: msg,
      });
    }
  }

  return results;
}
