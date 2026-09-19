import { unzip } from "fflate";

export type ApkVersion = {
  versionName: string | null;
  versionCode: number | null;
};

/**
 * Extract versionName / versionCode from an APK, entirely in the browser.
 *
 * An APK is a ZIP; its `AndroidManifest.xml` is compiled ("AXML") binary XML.
 * We unzip just that entry and read the `versionName`/`versionCode` attributes
 * of the <manifest> element from the AXML structure.
 */
export async function extractApkVersion(file: File): Promise<ApkVersion> {
  const buf = new Uint8Array(await file.arrayBuffer());

  const manifest = await new Promise<Uint8Array | null>((resolve) => {
    unzip(
      buf,
      { filter: (f) => f.name === "AndroidManifest.xml" },
      (err, data) => {
        if (err) return resolve(null);
        resolve(data["AndroidManifest.xml"] ?? null);
      }
    );
  });

  if (!manifest) return { versionName: null, versionCode: null };
  try {
    return parseAxmlVersion(manifest);
  } catch {
    return { versionName: null, versionCode: null };
  }
}

// --- Minimal binary AndroidManifest (AXML) parser ---

const RES_STRING_POOL_TYPE = 0x0001;
const RES_XML_START_ELEMENT_TYPE = 0x0102;
const UTF8_FLAG = 0x0100;
const TYPE_STRING = 0x03;

function parseAxmlVersion(data: Uint8Array): ApkVersion {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);

  // File header (8 bytes): type(2), headerSize(2), chunkSize(4).
  let pool: StringPool | null = null;
  const result: ApkVersion = { versionName: null, versionCode: null };

  let offset = 8;
  while (offset + 8 <= data.byteLength) {
    const type = dv.getUint16(offset, true);
    const size = dv.getUint32(offset + 4, true);
    if (size < 8) break;

    if (type === RES_STRING_POOL_TYPE) {
      pool = readStringPool(dv, offset);
    } else if (type === RES_XML_START_ELEMENT_TYPE && pool) {
      readStartElement(dv, offset, pool, result);
      if (result.versionName !== null && result.versionCode !== null) break;
    }

    offset += size;
  }

  return result;
}

type StringPool = {
  count: number;
  isUtf8: boolean;
  offsets: number[];
  stringsBase: number;
};

function readStringPool(dv: DataView, chunkStart: number): StringPool {
  const stringCount = dv.getUint32(chunkStart + 8, true);
  const flags = dv.getUint32(chunkStart + 16, true);
  const stringsStart = dv.getUint32(chunkStart + 20, true);
  const isUtf8 = (flags & UTF8_FLAG) !== 0;

  const offsets: number[] = [];
  const offsetsBase = chunkStart + 28;
  for (let i = 0; i < stringCount; i++) {
    offsets.push(dv.getUint32(offsetsBase + i * 4, true));
  }

  return {
    count: stringCount,
    isUtf8,
    offsets,
    stringsBase: chunkStart + stringsStart,
  };
}

function getString(dv: DataView, pool: StringPool, index: number): string {
  if (index < 0 || index >= pool.count) return "";
  const pos = pool.stringsBase + pool.offsets[index];

  if (pool.isUtf8) {
    // Two length fields (chars, then bytes); each may be 1 or 2 bytes.
    let p = pos;
    const skip = (len: number) => (len & 0x80 ? 2 : 1);
    p += skip(dv.getUint8(p));
    const byteLen0 = dv.getUint8(p);
    let byteLen = byteLen0;
    if (byteLen0 & 0x80) {
      byteLen = ((byteLen0 & 0x7f) << 8) | dv.getUint8(p + 1);
      p += 2;
    } else {
      p += 1;
    }
    const bytes = new Uint8Array(dv.buffer, dv.byteOffset + p, byteLen);
    return new TextDecoder("utf-8").decode(bytes);
  }

  // UTF-16LE
  let p = pos;
  let charLen = dv.getUint16(p, true);
  p += 2;
  if (charLen & 0x8000) {
    charLen = ((charLen & 0x7fff) << 16) | dv.getUint16(p, true);
    p += 2;
  }
  const bytes = new Uint8Array(dv.buffer, dv.byteOffset + p, charLen * 2);
  return new TextDecoder("utf-16le").decode(bytes);
}

function readStartElement(
  dv: DataView,
  chunkStart: number,
  pool: StringPool,
  result: ApkVersion
) {
  // Header 16 bytes, then: ns(4), name(4), attrStart(2), attrSize(2),
  // attrCount(2), ...
  const nameIdx = dv.getUint32(chunkStart + 20, true);
  if (getString(dv, pool, nameIdx) !== "manifest") return;

  const attrCount = dv.getUint16(chunkStart + 28, true);
  const attrsBase = chunkStart + 36;

  for (let i = 0; i < attrCount; i++) {
    const a = attrsBase + i * 20;
    const attrNameIdx = dv.getUint32(a + 4, true);
    const rawValueIdx = dv.getInt32(a + 8, true);
    const dataType = dv.getUint8(a + 15);
    const data = dv.getUint32(a + 16, true);

    const attrName = getString(dv, pool, attrNameIdx);
    if (attrName === "versionName") {
      result.versionName =
        rawValueIdx !== -1
          ? getString(dv, pool, rawValueIdx)
          : dataType === TYPE_STRING
            ? getString(dv, pool, data)
            : String(data);
    } else if (attrName === "versionCode") {
      result.versionCode = data;
    }
  }
}
