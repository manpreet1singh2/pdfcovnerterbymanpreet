'use client'

import { useRef, useState } from 'react'
import { ArrowRight, Check, Download, FileText, LockKeyhole, Menu, RefreshCw, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'

const MAX_FILE_SIZE = 20 * 1024 * 1024

type Status = 'idle' | 'ready' | 'converting' | 'success' | 'error'

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function Pdf2DocApp() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [downloadUrl, setDownloadUrl] = useState('')
  const [dragging, setDragging] = useState(false)

  const chooseFile = (selected?: File) => {
    if (!selected) return
    setError('')
    setDownloadUrl('')
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setStatus('error'); setError('Please choose a PDF file.'); return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setStatus('error'); setError('That PDF is larger than 20 MB.'); return
    }
    if (selected.size === 0) {
      setStatus('error'); setError('This PDF appears to be empty.'); return
    }
    setFile(selected); setStatus('ready')
  }

  const convert = async () => {
    if (!file) return
    setStatus('converting'); setError('')
    try {
      const body = new FormData(); body.append('file', file)
      const response = await fetch('/api/convert', { method: 'POST', body })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'We could not convert that PDF.')
      }
      const blob = await response.blob()
      setDownloadUrl(URL.createObjectURL(blob)); setStatus('success')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Something went wrong.'); setStatus('error')
    }
  }

  const reset = () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); setFile(null); setDownloadUrl(''); setError(''); setStatus('idle') }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3 font-semibold tracking-tight"><span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><FileText className="size-5" /></span><span className="text-lg">PDF<span className="text-primary">2</span>DOC</span></a>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex"><a href="#how-it-works" className="transition-colors hover:text-foreground">How it works</a><a href="#features" className="transition-colors hover:text-foreground">Features</a><a href="#privacy" className="transition-colors hover:text-foreground">Privacy</a></nav>
        <button className="rounded-full border border-border p-2 md:hidden" aria-label="Open menu"><Menu className="size-5" /></button>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-20">
          <div className="flex flex-col gap-7"><div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"><Sparkles className="size-3.5" /> Document conversion, simplified</div><h1 className="max-w-xl text-balance font-serif text-5xl leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">Your PDFs, now <em className="text-primary">editable.</em></h1><p className="max-w-lg text-pretty text-lg leading-8 text-muted-foreground">Turn PDF files into clean, editable Word documents in seconds. No sign-up, no clutter, no compromise.</p><div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-2"><Check className="size-4 text-primary" /> Up to 20 MB</span><span className="flex items-center gap-2"><Check className="size-4 text-primary" /> No account needed</span></div></div>
          <ConverterCard {...{ status, file, error, downloadUrl, dragging, setDragging, chooseFile, convert, reset, inputRef }} />
        </section>

        <section id="how-it-works" className="border-y border-border bg-card/60"><div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3 lg:px-8">{[['01', 'Drop your PDF', 'Drag a file into the converter or browse your device.'], ['02', 'We do the work', 'Our converter extracts your text and rebuilds the document.'], ['03', 'Download & edit', 'Open your new DOCX in Word, Pages, or Google Docs.']].map(([number, title, description]) => <div key={number} className="flex gap-4"><span className="font-mono text-sm text-primary">{number}</span><div className="flex flex-col gap-2"><h2 className="font-semibold">{title}</h2><p className="text-sm leading-6 text-muted-foreground">{description}</p></div></div>)}</div></section>
        <section id="features" className="mx-auto max-w-6xl px-6 py-20 lg:px-8"><div className="mb-10 flex flex-col gap-3"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Built for focus</p><h2 className="font-serif text-4xl tracking-tight">Simple by design. Useful by default.</h2></div><div className="grid gap-4 md:grid-cols-3"><Feature icon={<ShieldCheck />} title="Private by default" copy="Files are processed in memory and removed after conversion. Your documents stay yours." /><Feature icon={<RefreshCw />} title="Keeps your flow" copy="No account, no onboarding, no distractions. Upload, convert, and keep moving." /><Feature icon={<FileText />} title="Genuinely editable" copy="Get a real DOCX file you can update, share, and use in your existing workflow." /></div></section>
        <section id="privacy" className="bg-primary px-6 py-16 text-primary-foreground"><div className="mx-auto flex max-w-4xl flex-col items-start gap-5 md:flex-row md:items-center md:justify-between"><div className="flex max-w-xl flex-col gap-3"><h2 className="font-serif text-3xl">Your documents deserve discretion.</h2><p className="leading-7 text-primary-foreground/75">We do not store your files. Every conversion is request-scoped, and the result is delivered directly to you.</p></div><LockKeyhole className="hidden size-14 opacity-30 md:block" /></div></section>
      </main>
      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-8"><span>© 2026 PDF2DOC</span><span>Made for documents that move.</span></footer>
    </div>
  )
}

function ConverterCard({ status, file, error, downloadUrl, dragging, setDragging, chooseFile, convert, reset, inputRef }: any) {
  return <div className="rounded-[2rem] border border-border bg-card p-3 shadow-[0_24px_80px_-32px_hsl(var(--primary)/.35)]"><div className={`relative flex min-h-[360px] flex-col items-center justify-center rounded-[1.5rem] border-2 border-dashed px-6 py-10 text-center transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-border'} ${status === 'error' ? 'border-destructive/50 bg-destructive/5' : ''}`} onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(e) => { e.preventDefault(); setDragging(false); chooseFile(e.dataTransfer.files[0]) }}>
    <input ref={inputRef} type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => chooseFile(e.target.files?.[0])} />
    {status === 'idle' && <><span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-secondary text-primary"><Upload className="size-7" /></span><h2 className="text-xl font-semibold">Drop your PDF here</h2><p className="mt-2 text-sm text-muted-foreground">or choose a file from your device</p><button onClick={() => inputRef.current?.click()} className="mt-7 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Browse files</button></>}
    {status === 'ready' && file && <><span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="size-7" /></span><h2 className="max-w-full truncate text-xl font-semibold">{file.name}</h2><p className="mt-2 text-sm text-muted-foreground">{formatSize(file.size)} · PDF ready to convert</p><div className="mt-7 flex gap-3"><button onClick={reset} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary">Choose another</button><button onClick={convert} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Convert to DOCX <ArrowRight className="size-4" /></button></div></>}
    {status === 'converting' && <><span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><RefreshCw className="size-7 animate-spin" /></span><h2 className="text-xl font-semibold">Converting your PDF</h2><p className="mt-2 text-sm text-muted-foreground">Extracting text and preparing your DOCX…</p></>}
    {status === 'success' && <><span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><Check className="size-7" /></span><h2 className="text-xl font-semibold">Your DOCX is ready</h2><p className="mt-2 text-sm text-muted-foreground">{file?.name.replace(/\.pdf$/i, '')}.docx</p><div className="mt-7 flex gap-3"><button onClick={reset} className="rounded-full border border-border px-5 py-2.5 text-sm font-medium hover:bg-secondary">Convert another</button><a href={downloadUrl} download={`${file?.name.replace(/\.pdf$/i, '')}.docx`} className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Download DOCX <Download className="size-4" /></a></div></>}
    {status === 'error' && <><span className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"><X className="size-7" /></span><h2 className="text-xl font-semibold">We couldn&apos;t use that file</h2><p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">{error}</p><button onClick={reset} className="mt-7 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Try another PDF</button></>}
  </div><p className="flex items-center justify-center gap-2 px-4 pb-1 pt-4 text-xs text-muted-foreground"><LockKeyhole className="size-3" /> Files are deleted after conversion</p></div>
}

function Feature({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) { return <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6"><span className="flex size-10 items-center justify-center rounded-xl bg-secondary text-primary">{icon}</span><h3 className="font-semibold">{title}</h3><p className="text-sm leading-6 text-muted-foreground">{copy}</p></article> }
