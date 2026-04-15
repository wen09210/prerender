const fs = require('fs');
const path = require('path');

// Matches the original build command:
//   Windows : Compress-Archive → dist.zip
//   Linux   : cp -r …         → dist/
const INCLUDE = ['lib', 'server.js', 'package.json', 'package-lock.json', 'README.md', 'plugins'];

const rootPath = __dirname;
const isWindows = process.platform === 'win32';

if (isWindows) {
    // ── Windows: produce dist.zip via archiver ──────────────────────────────
    const archiver = require('archiver');
    const OUTPUT_ZIP = path.join(rootPath, 'dist.zip');

    fs.rmSync(OUTPUT_ZIP, { force: true });

    const output = fs.createWriteStream(OUTPUT_ZIP);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`Built dist.zip (${archive.pointer()} bytes)`);
    });

    archive.on('error', (err) => { throw err; });
    archive.pipe(output);

    INCLUDE.forEach((entry) => {
        const fullPath = path.join(rootPath, entry);
        if (!fs.existsSync(fullPath)) return;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            archive.directory(fullPath, entry);
        } else {
            archive.file(fullPath, { name: entry });
        }
    });

    archive.finalize();
} else {
    // ── Linux / macOS: produce dist/ via fs copy ────────────────────────────
    const distPath = path.join(rootPath, 'dist');

    fs.rmSync(distPath, { recursive: true, force: true });
    fs.mkdirSync(distPath, { recursive: true });

    function copyRecursive(src, dest) {
        const stat = fs.statSync(src);
        if (stat.isDirectory()) {
            fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach((child) => {
                copyRecursive(path.join(src, child), path.join(dest, child));
            });
        } else {
            fs.copyFileSync(src, dest);
        }
    }

    INCLUDE.forEach((entry) => {
        const src = path.join(rootPath, entry);
        if (!fs.existsSync(src)) return;
        copyRecursive(src, path.join(distPath, entry));
    });

    console.log('Built dist/');
}