import { PDFParse } from 'pdf-parse'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export const MAX_FILE_SIZE = 20 * 1024 * 1024

export function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 100) || 'converted-document'
}

export function isPdf(buffer: Buffer) {
  return buffer.subarray(0, 5).toString('ascii') === '%PDF-'
}

export function isDocxPackage(buffer: Buffer) {
  if (buffer.length < 4 || buffer.readUInt32LE(0) !== 0x04034b50) return false
  const names = new Set<string>()
  let offset = 0
  while (offset + 30 <= buffer.length && buffer.readUInt32LE(offset) === 0x04034b50) {
    const nameLength = buffer.readUInt16LE(offset + 26)
    const extraLength = buffer.readUInt16LE(offset + 28)
    const compressedSize = buffer.readUInt32LE(offset + 18)
    names.add(buffer.subarray(offset + 30, offset + 30 + nameLength).toString('utf8'))
    offset += 30 + nameLength + extraLength + compressedSize
  }
  return ['[Content_Types].xml', 'word/document.xml', '_rels/.rels'].every((part) => names.has(part))
}

export async function convertPdfToDocx(buffer: Buffer) {
  const parser = new PDFParse({ data: buffer })
  try {
    const parsed = await parser.getText()
    const text = parsed.text.replace(/\u0000/g, '').trim()
    if (!text) throw new Error('SCANNED_PDF')
    const paragraphs = text.split(/\n\s*\n|\n/).map((line) => line.trim()).filter(Boolean).map((line) => new Paragraph({ children: [new TextRun({ text: line })], spacing: { after: 160 } }))
    const doc = new Document({ sections: [{ children: paragraphs.length ? paragraphs : [new Paragraph('Converted document')] }] })
    const output = Buffer.from(await Packer.toBuffer(doc))
    if (!isDocxPackage(output)) throw new Error('INVALID_DOCX')
    return output
  } finally {
    await parser.destroy()
  }
}
