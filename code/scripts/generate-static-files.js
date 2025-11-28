import fs from "fs";
import path from "path";

// Recursive scan function
function scanDir(dir, baseUrl) {
  let results = [];

  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(scanDir(fullPath, baseUrl));
    } else {
      const relativePath = fullPath
        .replace(baseUrl, "")
        .replace(/\\/g, "/");

      // ignore .DS_Store, map files
      if (!relativePath.endsWith(".map") && !relativePath.includes(".DS_Store")) {
        results.push(relativePath);
      }
    }
  });

  return results;
}

// Directories
const publicDir = path.join(process.cwd(), "src", "public");
const cssDir = path.join(publicDir, "css");
const jsDir = path.join(publicDir, "js");

// Ensure folder existence
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

ensureDirExists(cssDir);
ensureDirExists(jsDir);

// Scan directories
const cssFiles = fs.existsSync(cssDir) ? scanDir(cssDir, publicDir) : [];
const jsFiles  = fs.existsSync(jsDir)  ? scanDir(jsDir, publicDir)  : [];

// Write individual lists
fs.writeFileSync(
  path.join(cssDir, "files.json"),
  JSON.stringify(cssFiles, null, 2)
);

fs.writeFileSync(
  path.join(jsDir, "files.json"),
  JSON.stringify(jsFiles, null, 2)
);

// Create universal precache manifest
const precache = [
  "/",
  "/index.html",
  ...cssFiles,
  ...jsFiles,
];

fs.writeFileSync(
  path.join(publicDir, "precache-manifest.json"),
  JSON.stringify(precache, null, 2)
);

console.log("✔ Static file lists generated successfully!");
