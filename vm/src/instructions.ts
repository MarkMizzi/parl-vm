/* Type representing a VM Opcode */
export enum PixIROpcode {
  // mathematical operations
  ADD = 'add',
  SUB = 'sub',
  MUL = 'mul',
  DIV = 'div',
  MOD = 'mod',
  INC = 'inc',
  DEC = 'dec',
  MAX = 'max',
  MIN = 'min',
  ROUND = 'round',
  // get random number
  IRND = 'irnd',
  // logical operations
  AND = 'and',
  OR = 'or',
  NOT = 'not',
  LT = 'lt',
  LE = 'le',
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GE = 'ge',
  // stack and control operations
  DUP = 'dup',
  DROP = 'drop',
  PUSH = 'push',
  NOP = 'nop',
  JMP = 'jmp',
  CJMP = 'cjmp',
  CJMP2 = 'cjmp2',
  CALL = 'call',
  RET = 'ret',
  HALT = 'halt',
  // allocate automatic vars, create stack frames.
  ALLOC = 'alloc',
  OFRAME = 'oframe',
  CFRAME = 'cframe',
  ST = 'st',
  // delay operation
  DELAY = 'delay',
  // screen related operations
  WRITE = 'write',
  WRITEBOX = 'writebox',
  CLEAR = 'clear',
  READ = 'read',
  WIDTH = 'width',
  HEIGHT = 'height',
  // log output
  PRINT = 'print',
  // array operations
  DUPA = 'dupa',
  STA = 'sta',
  PUSHA = 'pusha',
  PRINTA = 'printa',
  RETA = 'reta',
  // low level I/O operations
  GETCHAR = 'getchar',
  PUTCHAR = 'putchar'
}

/* Data type enum used to tag VM data so that it can be type-checked at runtime. */
export enum PushOperandType {
  NUMBER,
  LABEL,
  LABEL_W_OFFSET,
  PCOFFSET,
  FUNCTION
}

/* A Label is a location in VM memory, consisting of an [offset, frame] pair.
 * Data pointed to by the label will be in the offset^th position of frame.
 */
export type Label = [number, number]
/* Data type for function labels. */
export type FunctionName = string

/* Represents data type used by the VM (e.g. in work stack and frames). */
export interface PushOperand {
  dtype: PushOperandType
  val: number | Label | FunctionName
}

export interface PixIRInstruction {
  opcode: PixIROpcode
  operand?: PushOperand
}

export function rgbToHex(rgb: number): string {
  if (rgb > 0xffffff || rgb < 0)
    throw RangeError(`Invalid RGB number ${rgb}, must be in range [0, 0xffffff]`)

  const r = (rgb >> 16) & 0xff
  const g = (rgb >> 8) & 0xff
  const b = rgb & 0xff

  return `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
}

/* Utility function to parse rgb colour hex strings. */
function parseRGB(hex: string): number {
  return parseInt(hex.substring(1), 16)
}

/* Utility function that checks whether every character in input string is alpha-numeric */
function isAlphaNum(s: string): boolean {
  let isAlphaNum = true

  for (let i = 0; i < s.length; i++) {
    let charCode = s.charCodeAt(i)
    isAlphaNum &&=
      (charCode >= '0'.charCodeAt(0) && charCode <= '9'.charCodeAt(0)) ||
      (charCode >= 'a'.charCodeAt(0) && charCode <= 'z'.charCodeAt(0)) ||
      (charCode >= 'A'.charCodeAt(0) && charCode <= 'Z'.charCodeAt(0)) ||
      charCode == '_'.charCodeAt(0)
  }

  return isAlphaNum
}

export function validateFunctionName(funcName: FunctionName) {
  // validate function name
  if (funcName.length <= 1 || funcName[0] != '.')
    throw SyntaxError(`Invalid function name ${funcName} found.`)
  if (!isAlphaNum(funcName.substring(1)))
    throw SyntaxError(`Invalid function name ${funcName} found.`)
}

function readOperand(opStr: string): PushOperand {
  // try checking if operand is a number
  const numValue = parseFloat(opStr)
  if (!isNaN(numValue)) return { dtype: PushOperandType.NUMBER, val: numValue }

  // try checking if operand is a function name
  if (opStr[0] == '.') {
    // validate function name
    validateFunctionName(opStr)
    return { dtype: PushOperandType.FUNCTION, val: opStr }
  }
  // try checking if operand is a label w/ offset
  if (opStr.substring(0, 2) == '+[' && opStr[opStr.length - 1] == ']') {
    const label = opStr.substring(2, opStr.length - 1)
    const splitLabel = label.split(':', 2)
    const offset = parseInt(splitLabel[0])
    let frame = 0
    if (splitLabel.length > 1) frame = parseInt(splitLabel[1])
    if (isNaN(offset) || isNaN(frame)) throw SyntaxError(`Invalid label ${opStr} found.`)
    return { dtype: PushOperandType.LABEL_W_OFFSET, val: [offset, frame] }
  }

  // try checking if operand is a label
  if (opStr[0] == '[' && opStr[opStr.length - 1] == ']') {
    const label = opStr.substring(1, opStr.length - 1)
    const splitLabel = label.split(':', 2)
    const offset = parseInt(splitLabel[0])
    let frame = 0
    if (splitLabel.length > 1) frame = parseInt(splitLabel[1])
    if (isNaN(offset) || isNaN(frame)) throw SyntaxError(`Invalid label ${opStr} found.`)
    return { dtype: PushOperandType.LABEL, val: [offset, frame] }
  }

  // try checking if operand is a PC offset
  if (opStr.substring(0, 3) == '#PC') {
    const offset = parseInt(opStr.substring(3))
    if (isNaN(offset)) throw SyntaxError(`Invalid PC offset ${opStr} found.`)
    return { dtype: PushOperandType.PCOFFSET, val: offset }
  }

  // try checking if operand is a Colour
  let isColor = opStr.length == 7
  if (isColor) {
    isColor &&= opStr[0] == '#'
    // check that rest of string after # is a hex literal.
    isColor &&= !isNaN(parseInt(opStr.substring(1), 16))
  }
  if (!isColor) throw SyntaxError(`Invalid push operand ${opStr} found.`)
  return { dtype: PushOperandType.NUMBER, val: parseRGB(opStr) }
}

export function readInstr(line: string): PixIRInstruction {
  const splitInstr = line.split(' ')
  let opcodeStr = splitInstr[0]
  opcodeStr = opcodeStr.toLowerCase()
  if (!Object.values(PixIROpcode).includes(opcodeStr as PixIROpcode))
    throw SyntaxError(`${splitInstr[0]} is not a valid instruction.`)
  const opcode = splitInstr[0] as PixIROpcode

  // get opcode operand if the opcode is a push instruction
  let operand: PushOperand | undefined = undefined
  if (opcode === PixIROpcode.PUSH) {
    if (splitInstr.length == 1) throw SyntaxError('Operand for push instruction was not specified.')
    if (splitInstr.length != 2)
      throw SyntaxError('Extra operands specified for push instruction; can only specify one.')
    operand = readOperand(splitInstr[1])
  } else if (opcode === PixIROpcode.PUSHA) {
    const opStr = splitInstr[1]
    // parse memory label; code repeated from readOperand()
    if (opStr[0] == '[' && opStr[opStr.length - 1] == ']') {
      const label = opStr.substring(1, opStr.length - 1)
      const splitLabel = label.split(':', 2)
      const offset = parseInt(splitLabel[0])
      let frame = 0
      if (splitLabel.length > 1) frame = parseInt(splitLabel[1])
      if (isNaN(offset) || isNaN(frame)) throw SyntaxError(`Invalid label ${opStr} found.`)
      operand = { dtype: PushOperandType.LABEL, val: [offset, frame] }
    } else {
      throw SyntaxError(
        `Invalid operand given to pusha instruction ${opStr}; operand should be memory location in form [offset:frame].`
      )
    }
  }

  return { opcode, operand }
}
