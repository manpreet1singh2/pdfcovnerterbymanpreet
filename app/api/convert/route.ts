import { NextResponse } from 'next/server'
import { PDFParse } from 'pdf-parse'
import { Document, Packer, Paragraph, TextRun } from 'docx'

export const runtime = 'nodejs'
const MAX_FILE_SIZE = 20 * 1024 * 1024

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^[-.]+|[-.]+$/g, '').slice(0, 100) || 'converted-document'
}

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const entry = form.get('file')
    if (!(entry instanceof File)) return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 })
    if (entry.size === 0) return NextResponse.json({ error: 'This PDF appears to be empty.' }, { status: 400 })
    if (entry.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'That PDF is larger than 20 MB.' }, { status: 413 })
    const buffer = Buffer.from(await entry.arrayBuffer())
    if (buffer.subarray(0, 5).toString() !== '%PDF-') return NextResponse.json({ error: 'This file is not a valid PDF.' }, { status: 400 })

    const parser = new PDFParse({ data: buffer })
    const parsed = await parser.getText()
    await parser.destroy()
    const text = parsed.text.trim()
    if (!text) return NextResponse.json({ error: 'This looks like a scanned PDF. OCR is not enabled yet, so we could not find editable text.' }, { status: 422 })

    const paragraphs = text.split(/\n\s*\n|\n/).map((line) => new Paragraph({ children: [new TextRun({ text: line.trim() })], spacing: { after: 160 } })).filter(Boolean)
    const doc = new Document({ sections: [{ properties: {}, children: paragraphs.length ? paragraphs : [new Paragraph('Converted document')] }] })
    const output = await Packer.toBuffer(doc)
    const filename = `${safeName(entry.name.replace(/\.pdf$/i, ''))}.docx`
    return new NextResponse(output as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store' } })
  } catch {
    return NextResponse.json({ error: 'We could not convert that PDF. Please try a different file.' }, { status: 500 })
  }
}
