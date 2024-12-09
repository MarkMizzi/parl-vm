/* CodeMirror extension for supporting Pixel language */

import { LanguageSupport, LRLanguage } from '@codemirror/language'

import { parlAsmParser } from 'parl-highlighting'

export function parlAsm() {
  return new LanguageSupport(
    LRLanguage.define({
      name: 'parl-asm',
      parser: parlAsmParser
    }),
    []
  )
}
