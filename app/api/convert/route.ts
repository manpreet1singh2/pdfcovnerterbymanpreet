import { NextResponse } from 'next/server'
import { convertPdfToDocx, isPdf, MAX_FILE_SIZE, safeName } from '@/lib/conversion'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const form = await request.formData()
    const entry = form.get('file')
    if (!(entry instanceof File)) return NextResponse.json({ error: 'Please upload a PDF file.' }, { status: 400 })
    if (entry.size === 0) return NextResponse.json({ error: 'This PDF appears to be empty.' }, { status: 400 })
    if (entry.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'That PDF is larger than 20 MB.' }, { status: 413 })
    const buffer = Buffer.from(await entry.arrayBuffer())
    if (!isPdf(buffer)) return NextResponse.json({ error: 'This file is not a valid PDF.' }, { status: 400 })

    let output: Buffer
    try {
      output = await convertPdfToDocx(buffer)
    } catch (error) {
      if (error instanceof Error && error.message === 'SCANNED_PDF') return NextResponse.json({ error: 'This looks like a scanned PDF. OCR is not enabled yet, so we could not find editable text.' }, { status: 422 })
      if (error instanceof Error && /password|encrypted/i.test(error.message)) return NextResponse.json({ error: 'This PDF is password-protected. Remove the password and try again.' }, { status: 422 })
      if (error instanceof Error && /invalid|format|corrupt|unexpected end/i.test(error.message)) return NextResponse.json({ error: 'This PDF appears to be damaged or unsupported. Please export it again and retry.' }, { status: 422 })
      throw error
    }
    const filename = `${safeName(entry.name.replace(/\.pdf$/i, ''))}.docx`
    return new NextResponse(output as BodyInit, { headers: { 'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
  } catch {
    return NextResponse.json({ error: 'We could not convert that PDF. Please try a different file.' }, { status: 500 })
  }
}
