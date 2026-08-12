# karel-testgen

A standalone CLI tool to generate Karel test case outputs (`.out`) from solutions (`.kp` or `.kj`) and input worlds (`.in`).

This tool uses `@rekarel/core` under the hood, ensuring identical results to the OMIPS judge worker.

## Installation

### Option 1: Local npm (Recommended)

Requires [Node.js](https://nodejs.org/) v20+.

```bash
git clone git@github.com:saulcanche/karel-testgen.git
cd karel-testgen
npm install
npm link
```

This will make the `karel-testgen` command available globally on your system.

### Option 2: Docker

If you prefer not to install Node.js locally, you can use Docker.

```bash
git clone git@github.com:saulcanche/karel-testgen.git
cd karel-testgen
docker build -t karel-testgen .
```

## Usage

### Generate Outputs

Run a Karel solution against all `.in` files in a directory to generate the corresponding `.out` files.

#### Using npm (if installed globally)
```bash
karel-testgen generate -s path/to/solution.kp -c path/to/cases/
```

#### Using Docker
Mount your local problems directory into the container to process them:

```bash
docker run --rm -v $(pwd)/problems:/work karel-testgen generate -s /work/sol.kp -c /work/cases/
```

### Options

*   `-s, --solution <path>`: (Required) Path to the `.kp` or `.kj` solution file.
*   `-c, --cases <dir>`: (Required) Directory containing `.in` test case files.
*   `-o, --output <dir>`: Output directory for `.out` files. Defaults to the cases directory.
*   `-f, --force`: Overwrite existing `.out` files. Default is false.
*   `-h, --help`: Display help information.

## Example

```bash
$ karel-testgen generate -s antenas/solution.kp -c antenas/

🤖 karel-testgen

  Solution:  solution.kp
  Cases:     /home/user/karel-testgen/antenas
  Force:     no

Compiling solution...
  ✓ sub1.1.in → sub1.1.out
  ✓ sub1.2.in → sub1.2.out
  ...

─── Summary ───
  24 generated
```
