#!/usr/bin/env node
const archiver = require('archiver');
const fs = require('fs');
const path = require('path');

const OUTPUT = 'dist.zip';
const EXCLUDE = ['node_modules', '.git', '.DS_Store', 'dist', '*.log'];

const output = fs.createWriteStream(path.join(__dirname, OUTPUT));
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`Built ${OUTPUT} (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

archive.glob('**/*', {
    cwd: __dirname,
    ignore: EXCLUDE.concat([OUTPUT]),
    dot: false
});

archive.finalize();
