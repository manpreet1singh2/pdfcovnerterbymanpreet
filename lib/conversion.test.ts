import test from 'node:test'
import assert from 'node:assert/strict'
import { isDocxPackage, isPdf, safeName } from './conversion'

test('accepts PDF signatures only', () => {
  assert.equal(isPdf(Buffer.from('%PDF-1.7')), true)
  assert.equal(isPdf(Buffer.from('not a pdf')), false)
})

test('sanitizes download names', () => {
  assert.equal(safeName('../../invoice:2026'), 'invoice-2026')
  assert.equal(safeName(''), 'converted-document')
})

test('rejects non-DOCX zip signatures', () => {
  assert.equal(isDocxPackage(Buffer.from('PK\\x03\\x04')), false)
})
