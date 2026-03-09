import solc from "solc";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function findSolFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            findSolFiles(filePath, fileList);
        } else if (file.endsWith(".sol")) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

const srcPath = path.resolve(__dirname, "src");
const testPath = path.resolve(__dirname, "test");
const allFiles = [...findSolFiles(srcPath), ...findSolFiles(testPath)];

const sources = {};
for (const file of allFiles) {
    const relPath = path.relative(__dirname, file).replace(/\\/g, '/');
    sources[relPath] = {
        content: fs.readFileSync(file, "utf8"),
    };
}

const input = {
    language: "Solidity",
    sources: sources,
    settings: {
        optimizer: {
            enabled: true,
            runs: 200,
        },
        outputSelection: {
            "*": {
                "*": ["abi", "evm.bytecode"],
            },
        },
    },
};

function findImports(importPath) {
    try {
        let resolvedPath;
        if (importPath.startsWith("@openzeppelin")) {
            resolvedPath = path.join(__dirname, "node_modules", importPath);
        } else if (importPath.startsWith("forge-std")) {
            const relativePath = importPath.substring(10);
            resolvedPath = path.join(__dirname, "lib", "forge-std", "src", relativePath);
        } else {
            resolvedPath = path.join(__dirname, importPath);
        }
        return { contents: fs.readFileSync(resolvedPath, "utf8") };
    } catch (error) {
        return { error: "File not found" };
    }
}

console.log("Compiling contracts...");
const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));

if (output.errors) {
    output.errors.forEach((err) => {
        console.error(err.formattedMessage);
    });
    const hasErrors = output.errors.some(e => e.severity === 'error');
    if (hasErrors) process.exit(1);
}

console.log("Compilation successful!");
