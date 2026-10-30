// Prepare this computer's installed Gungsuh font for the owner's local preview.
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync('C:/Windows/Fonts/batang.ttc');
let font;
for (let i = 0; i < source.readUInt32BE(8); i++) {
  const base = source.readUInt32BE(12 + i * 4);
  const count = source.readUInt16BE(base + 4);
  const tables = Array.from({ length: count }, (_, j) => {
    const p = base + 12 + j * 16;
    return { tag: source.toString('ascii', p, p + 4), checksum: source.readUInt32BE(p + 4), offset: source.readUInt32BE(p + 8), length: source.readUInt32BE(p + 12) };
  });
  const name = tables.find(t => t.tag === 'name');
  const names = source.subarray(name.offset, name.offset + name.length);
  let matches = false;
  for (let j = 0; j < names.readUInt16BE(2); j++) {
    const p = 6 + j * 12;
    if (names.readUInt16BE(p + 6) !== 1) continue;
    const start = names.readUInt16BE(4) + names.readUInt16BE(p + 10);
    const bytes = Buffer.from(names.subarray(start, start + names.readUInt16BE(p + 8)));
    const value = names.readUInt16BE(p) === 3 ? bytes.swap16().toString('utf16le') : bytes.toString();
    if (value === 'Gungsuh') matches = true;
  }
  if (!matches) continue;
  let cursor = 12 + count * 16;
  font = Buffer.alloc(cursor + tables.reduce((sum, t) => sum + ((t.length + 3) & ~3), 0));
  source.copy(font, 0, base, base + 12);
  tables.forEach((t, j) => {
    const p = 12 + j * 16;
    font.write(t.tag, p, 4, 'ascii'); font.writeUInt32BE(t.checksum, p + 4);
    font.writeUInt32BE(cursor, p + 8); font.writeUInt32BE(t.length, p + 12);
    source.copy(font, cursor, t.offset, t.offset + t.length);
    if (t.tag === 'head') { font.writeUInt32BE(0, cursor + 8); t.adjustment = cursor + 8; }
    cursor += (t.length + 3) & ~3;
  });
  let sum = 0;
  for (let p = 0; p < font.length; p += 4) sum = (sum + font.readUInt32BE(p)) >>> 0;
  font.writeUInt32BE((0xB1B0AFBA - sum) >>> 0, tables.find(t => t.tag === 'head').adjustment);
  break;
}
if (!font) throw new Error('Installed Gungsuh font was not found');
fs.writeFileSync(path.join(__dirname, '../assets/Gungsuh.ttf'), font);
console.log('Prepared Gungsuh.ttf:', font.length, 'bytes');
