import {
  type PixIRData,
  type Label,
  PixIROpcode,
  PixIRDataType,
  checkDataType,
  dataToString,
  rgbToHex
} from './instructions'
import { type Program } from './assembler'

type Frame = Array<PixIRData | undefined>

export interface ParlVMState {
  screenHandle: HTMLCanvasElement
  loggerHandle: HTMLTextAreaElement
  frameStack: Array<Frame>
  workStack: Array<PixIRData>
  programCounter: number
  // store return pointers
  retStack: Array<number>
  height: number
  width: number
  halted: boolean
  paused: boolean
}

export class ParlVM {
  protected static initState(
    screenHandle: HTMLCanvasElement,
    loggerHandle: HTMLTextAreaElement
  ): ParlVMState {
    return {
      screenHandle,
      loggerHandle,
      frameStack: [[]],
      workStack: [],
      programCounter: 0,
      retStack: [],
      height: 100,
      width: 100,
      halted: true,
      paused: false
    }
  }

  protected program: Program

  // While this may look like a weird way to represent state,
  // it allows us to override getters and setters for this.state in subclasses.
  private _state: ParlVMState
  protected get state(): ParlVMState {
    return this._state
  }
  protected set state(v: ParlVMState) {
    this._state = v
  }

  constructor(screenHandle: HTMLCanvasElement, loggerHandle: HTMLTextAreaElement) {
    this._state = ParlVM.initState(screenHandle, loggerHandle)
    // initialize program to the program that does nothing and halts immediately.
    this.program = {
      instrs: [{ opcode: PixIROpcode.HALT, operand: undefined }],
      funcs: new Map([['.main', 0]])
    }
  }

  /* Pop safely from the work stack. */
  private safePop(): PixIRData {
    let x = this.state.workStack.pop()
    if (x === undefined) throw ReferenceError('Empty stack when operand is needed.')
    return x
  }

  /* Utility function to scale (x, y) on PixelVM screen by canvas dimensions. */
  private scaleCanvas(x: number, y: number): [number, number] {
    return [
      (x * this.state.screenHandle.width) / this.state.width,
      (y * this.state.screenHandle.height) / this.state.height
    ]
  }

  private fillRect(x: number, y: number, w: number, h: number, c: number) {
    if (x < 0 || y < 0 || x + w > this.state.width || y + h > this.state.height)
      throw RangeError(`Out of bounds fill x=${x}, y=${y}, w=${w}, h=${h} requested.`)

    // scale given variables to the actual Javascript canvas
    const [canvasX, canvasY] = this.scaleCanvas(x, this.state.height - y - h)
    const [canvasW, canvasH] = this.scaleCanvas(w, h)

    // fill in the rectangle.
    let context = this.state.screenHandle.getContext('2d')
    context!.fillStyle = rgbToHex(c)
    context!.fillRect(canvasX, canvasY, canvasW, canvasH)
  }

  public load(program: Program) {
    this.stop()
    this.program = program
    this.reset()
  }

  public reset() {
    this.state.frameStack = [[]]
    this.state.workStack = []
    this.state.programCounter = 0
    this.state.paused = false
  }

  private async step() {
    if (this.state.halted) throw Error('Trying to execute step in halted VM.')

    const pc = this.state.programCounter

    try {
      if (pc < 0)
        throw RangeError(
          `Program counter ${pc} is out of bounds (< 0), program jumped too far back.`
        )
      if (pc >= this.program.instrs.length)
        throw RangeError(
          `Program counter ${pc} is larger than biggest possible value ${this.program.instrs.length - 1}.`
        )

      const instr = this.program.instrs[pc]

      switch (instr.opcode) {
        /// Mathematical operations
        /// ------------------------------------------------------
        case PixIROpcode.ADD: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) + (y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.SUB: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) - (y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.MUL: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])
          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) * (y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.DIV: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) / (y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.MOD: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) % (y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.INC: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) + 1
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.DEC: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (x.val as number) - 1
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.OR:
        case PixIROpcode.MAX: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: Math.max(x.val as number, y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.AND:
        case PixIROpcode.MIN: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: Math.min(x.val as number, y.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.ROUND: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: Math.round(x.val as number)
          })

          // update pc
          this.state.programCounter++
          break
        }

        // get random number
        case PixIROpcode.IRND: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])

          if ((x.val as number) <= 0) {
            throw RangeError(`Argument to irnd instruction is ${dataToString(x)} <= 0, must be > 0`)
          }

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: Math.round(Math.random() * ((x.val as number) - 1))
          })

          // update pc
          this.state.programCounter++
          break
        }

        /// Logical operations
        /// ------------------------------------------------------

        case PixIROpcode.NOT: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: 1 - ((x.val as number) > 0 ? 1 : 0)
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.LT: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: x.val < y.val ? 1 : 0
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.LE: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: x.val <= y.val ? 1 : 0
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.EQ: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [y.dtype])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: x.val == y.val ? 1 : 0
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.NEQ: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [y.dtype])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: x.val != y.val ? 1 : 0
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.GT: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: x.val > y.val ? 1 : 0
          })

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.GE: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: x.val >= y.val ? 1 : 0
          })

          // update pc
          this.state.programCounter++
          break
        }

        /// Stack and Control flow operations
        /// ------------------------------------------------------

        case PixIROpcode.DUP: {
          const x = this.safePop()

          this.state.workStack.push(x)
          this.state.workStack.push(x)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.DROP: {
          this.safePop()

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.PUSH: {
          if (instr.operand?.dtype == PixIRDataType.LABEL) {
            const [offset, frame] = instr.operand?.val as Label
            const data = this.state.frameStack[frame][offset]
            if (data == undefined) {
              throw RangeError(`Memory access to undefined location [${offset}:${frame}]`)
            }
            this.state.workStack.push(data)
          } else if (instr.operand?.dtype == PixIRDataType.LABEL_W_OFFSET) {
            let [offset, frame] = instr.operand?.val as Label
            const index = this.safePop()

            checkDataType(index, [PixIRDataType.NUMBER])

            // add index we obtained from the work stack.
            offset += index.val as number
            const data = this.state.frameStack[frame][offset]
            if (data == undefined) {
              throw RangeError(`Memory access to undefined location [${offset}:${frame}]`)
            }
            this.state.workStack.push(data)
          } else if (instr.operand?.dtype == PixIRDataType.PCOFFSET) {
            const pcoffset = instr.operand?.val as number
            // push ptr to instruction to work stack, as when we use the pc offset, pc will have changed.
            this.state.workStack.push({
              dtype: PixIRDataType.NUMBER,
              val: pc + pcoffset
            })
          } else {
            this.state.workStack.push(instr.operand as PixIRData)
          }

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.NOP: {
          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.JMP: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          this.state.programCounter = x.val as number
          break
        }

        case PixIROpcode.CJMP: {
          const instrptr = this.safePop()
          const cond = this.safePop()

          checkDataType(instrptr, [PixIRDataType.NUMBER])
          checkDataType(cond, [PixIRDataType.NUMBER])

          // update pc
          if ((cond.val as number) != 0) this.state.programCounter = instrptr.val as number
          else this.state.programCounter++
          break
        }

        case PixIROpcode.CJMP2: {
          const instrptr = this.safePop()
          const cond = this.safePop()

          checkDataType(instrptr, [PixIRDataType.NUMBER])
          checkDataType(cond, [PixIRDataType.NUMBER])

          // update pc
          if ((cond.val as number) == 0) this.state.programCounter = instrptr.val as number
          else this.state.programCounter++
          break
        }

        case PixIROpcode.CALL: {
          const funcName = this.safePop()
          const argCount = this.safePop()

          checkDataType(funcName, [PixIRDataType.FUNCTION])
          checkDataType(argCount, [PixIRDataType.NUMBER])

          let frame: Frame = []
          for (let i = 0; i < (argCount.val as number); i++) frame.push(this.safePop())

          this.state.frameStack.unshift(frame)
          this.state.retStack.push(this.state.programCounter + 1)

          if (!this.program.funcs.has(funcName.val as string))
            throw Error(`Tried calling function ${funcName} which does not exist.`)

          this.state.programCounter = this.program.funcs.get(funcName.val as string)!
          break
        }

        case PixIROpcode.RET: {
          if (this.state.retStack.length === 0)
            throw RangeError(`Tried popping return pointer from stack when it was empty.`)
          this.state.programCounter = this.state.retStack.pop()!
          break
        }

        case PixIROpcode.HALT: {
          this.state.halted = true
          break
        }

        // allocate automatic vars, create stack frames.
        case PixIROpcode.ALLOC: {
          const size = this.safePop()

          checkDataType(size, [PixIRDataType.NUMBER])

          for (let i = 0; i < (size.val as number); i++) this.state.frameStack[0].push(undefined)

          this.state.programCounter++
          break
        }

        case PixIROpcode.OFRAME: {
          const size = this.safePop()

          checkDataType(size, [PixIRDataType.NUMBER])

          let frame: Frame = []
          for (let i = 0; i < (size.val as number); i++) frame.push(undefined)

          this.state.frameStack.unshift(frame)

          this.state.programCounter++
          break
        }

        case PixIROpcode.CFRAME: {
          this.state.frameStack.shift()

          this.state.programCounter++
          break
        }

        case PixIROpcode.ST: {
          const frame_ = this.safePop()
          const location_ = this.safePop()
          const val = this.safePop()

          checkDataType(location_, [PixIRDataType.NUMBER])
          checkDataType(frame_, [PixIRDataType.NUMBER])

          const frame = frame_.val as number
          const location = location_.val as number

          if (frame >= this.state.frameStack.length || frame < 0)
            throw RangeError(
              `Access to out of bounds frame ${frame}, valid range is [0, ${this.state.frameStack.length - 1}]`
            )

          if (location >= this.state.frameStack[frame].length || location < 0)
            throw RangeError(
              `Access to out of bounds location ${location}, valid range is [0, ${this.state.frameStack[frame].length - 1}]`
            )

          this.state.frameStack[frame][location] = val

          this.state.programCounter++
          break
        }

        // delay operation
        case PixIROpcode.DELAY: {
          // https://builtin.com/software-engineering-perspectives/javascript-sleep
          // sleep in Javascript; delay given in milliseconds
          const sleep = (delay: number) => new Promise((resolve) => setTimeout(resolve, delay))

          const delay = this.safePop()

          checkDataType(delay, [PixIRDataType.NUMBER])

          await sleep(delay.val as number)

          this.state.programCounter++
          break
        }

        /// Screen related operations
        /// ------------------------------------------------------

        case PixIROpcode.WRITE: {
          const x = this.safePop()
          const y = this.safePop()
          const c = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])
          checkDataType(c, [PixIRDataType.NUMBER])

          this.fillRect(x.val as number, y.val as number, 1, 1, c.val as number)

          this.state.programCounter++
          break
        }

        case PixIROpcode.WRITEBOX: {
          const x = this.safePop()
          const y = this.safePop()
          const w = this.safePop()
          const h = this.safePop()
          const c = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])
          checkDataType(w, [PixIRDataType.NUMBER])
          checkDataType(h, [PixIRDataType.NUMBER])
          checkDataType(c, [PixIRDataType.NUMBER])

          this.fillRect(
            x.val as number,
            y.val as number,
            w.val as number,
            h.val as number,
            c.val as number
          )

          this.state.programCounter++
          break
        }

        case PixIROpcode.CLEAR: {
          const c = this.safePop()

          checkDataType(c, [PixIRDataType.NUMBER])

          this.fillRect(0, 0, this.state.width, this.state.height, c.val as number)

          this.state.programCounter++
          break
        }

        case PixIROpcode.READ: {
          const x = this.safePop()
          const y = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])
          checkDataType(y, [PixIRDataType.NUMBER])

          let [canvasX, canvasY] = this.scaleCanvas(x.val as number, y.val as number)
          const [canvasX_, canvasY_] = this.scaleCanvas(
            (x.val as number) + 1,
            (y.val as number) + 1
          )
          // find center of canvas rectangle representing pixel (x, y) of PixelVM screen,
          // this ensures we read from the right region of the canvas despite any floating point rounding errors.
          canvasX = (canvasX + canvasX_) / 2
          canvasY = (canvasY + canvasY_) / 2

          const context = this.state.screenHandle.getContext('2d')
          const imageData = context!.getImageData(canvasX, canvasY, 1, 1).data
          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: (imageData[0] << 16) | (imageData[1] << 8) | imageData[2]
          })

          this.state.programCounter++
          break
        }

        case PixIROpcode.WIDTH: {
          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: this.state.width
          })

          this.state.programCounter++
          break
        }

        case PixIROpcode.HEIGHT: {
          this.state.workStack.push({
            dtype: PixIRDataType.NUMBER,
            val: this.state.height
          })

          this.state.programCounter++
          break
        }

        // log output
        case PixIROpcode.PRINT: {
          const x = this.safePop()
          this.state.loggerHandle.value += `${dataToString(x)}\n`

          this.state.programCounter++
          break
        }

        /// Array operations
        /// ------------------------------------------------------

        case PixIROpcode.DUPA: {
          const x = this.safePop()
          const count = this.safePop()

          checkDataType(count, [PixIRDataType.NUMBER])

          for (let i: number = 0; i < (count.val as number); i++) {
            this.state.workStack.push(x)
          }

          this.state.programCounter++
          break
        }

        case PixIROpcode.STA: {
          const frame_ = this.safePop()
          const location_ = this.safePop()
          const count_ = this.safePop()

          checkDataType(frame_, [PixIRDataType.NUMBER])
          checkDataType(location_, [PixIRDataType.NUMBER])
          checkDataType(count_, [PixIRDataType.NUMBER])

          const frame = frame_.val as number
          const location = location_.val as number
          const count = count_.val as number

          if (frame >= this.state.frameStack.length || frame < 0)
            throw RangeError(
              `Access to out of bounds frame ${frame}, valid range is [0, ${this.state.frameStack.length - 1}]`
            )

          if (location + count - 1 >= this.state.frameStack[frame].length || location < 0)
            throw RangeError(
              `Access to out of bounds location range [${location}, ${location + count - 1}], valid range is [0, ${this.state.frameStack[frame].length - 1}]`
            )

          for (let i = 0; i < count; i++)
            this.state.frameStack[frame][location + i] = this.safePop()

          this.state.programCounter++
          break
        }

        case PixIROpcode.PUSHA: {
          const count_ = this.safePop()

          checkDataType(count_, [PixIRDataType.NUMBER])

          const count = count_.val as number

          if (instr.operand?.dtype == PixIRDataType.LABEL) {
            const [location, frame] = instr.operand?.val as Label

            if (frame >= this.state.frameStack.length || frame < 0)
              throw RangeError(
                `Access to out of bounds frame ${frame}, valid range is [0, ${this.state.frameStack.length - 1}]`
              )

            if (location + count - 1 >= this.state.frameStack[frame].length || location < 0)
              throw RangeError(
                `Access to out of bounds location range [${location}, ${location + count - 1}], valid range is [0, ${this.state.frameStack[frame].length - 1}]`
              )

            for (let i: number = 0; i < count; i++) {
              this.state.workStack.push(this.state.frameStack[frame][location + i]!)
            }
          } else {
            throw Error(
              `Invalid operand to pusha instruction ${instr.operand}, should be memory location.`
            )
          }

          this.state.programCounter++
          break
        }

        case PixIROpcode.PRINTA: {
          const count_ = this.safePop()

          checkDataType(count_, [PixIRDataType.NUMBER])

          const count = count_.val as number

          for (let i: number = 0; i < count; i++) {
            this.state.loggerHandle.value += `${dataToString(this.safePop())}\n`
          }

          this.state.programCounter++
          break
        }

        case PixIROpcode.RETA: {
          const count_ = this.safePop()

          checkDataType(count_, [PixIRDataType.NUMBER])

          const count = count_.val as number

          let buf: PixIRData[] = []
          for (let i: number = 0; i < count; i++) {
            buf.push(this.safePop())
          }
          for (let i: number = 0; i < count; i++) {
            this.state.workStack.push(buf.shift()!)
          }

          this.state.programCounter++
          break
        }

        /// Low level I/O
        /// ------------------------------------------------------

        case PixIROpcode.GETCHAR: {
          // https://stackoverflow.com/questions/44746592/is-there-a-way-to-write-async-await-code-that-responds-to-onkeypress-events
          let val: number = 0
          while (val === 0) {
            // loop until we get a non-nul character

            // timer for invocations of readKey()
            let timer

            const readKey = () =>
              new Promise((resolve, reject) => {
                timer = setTimeout(() => reject(), 200)
                window.addEventListener('keydown', resolve, { once: true })
              })

            let key: string = ''
            // we wait for a key press from the user
            // each 200ms we check if the VM has halted or paused.
            while (key === '') {
              try {
                // we wait for a key from user with timeout of 200ms
                key = ((await readKey()) as KeyboardEvent).key
              } catch (e) {
                // if timeout expires, we catch the promise rejection.
              }
              // clear timeout
              clearTimeout(timer!)

              // if the VM was halted or paused while we were waiting, we return
              // Note that we do NOT advance the PC in case the VM was paused,
              // as we have not yet processed a char and we need to resume at the
              // start of the getchar instruction.
              if (this.state.halted || this.state.paused) return
            }

            if (key.length > 1) {
              // the key we got is a special key, process it
              switch (key) {
                // These are the only special keys we handle.
                // For a full list, see here:
                // https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
                case 'Enter':
                  val = '\n'.charCodeAt(0)
                  break
                case 'Tab':
                  val = '\t'.charCodeAt(0)
                  break
              }
            } else {
              // for regular characters we just get the unicode point from the char itself.
              val = key.charCodeAt(0)
            }
          }

          this.state.workStack.push({ dtype: PixIRDataType.NUMBER, val })

          this.state.programCounter++
          break
        }

        case PixIROpcode.PUTCHAR: {
          const x = this.safePop()

          checkDataType(x, [PixIRDataType.NUMBER])

          const charCode = Math.round(x.val as number)
          this.state.loggerHandle.value += `${String.fromCharCode(charCode)}`

          this.state.programCounter++
          break
        }
      }
    } catch (e) {
      // any errors are fatal and halt the VM
      this.state.halted = true
      throw e
    }
  }

  public async run() {
    this.reset()
    this.state.halted = false
    await this.continue()
  }

  public async continue() {
    this.state.paused = false
    while (!this.state.halted && !this.state.paused) {
      await this.step()
    }
  }

  public pause() {
    this.state.paused = true
  }

  public stop() {
    this.state.halted = true
  }

  public async safeStep() {
    if (this.state.halted) {
      this.reset()
      this.state.halted = false
      this.state.paused = true
    } else if (!this.state.paused) {
      throw Error('Cannot step while the Pixel VM is running.')
    }

    await this.step()
  }

  public async stepOut() {
    if (this.state.halted) {
      this.reset()
      this.state.halted = false
      this.state.paused = true
    } else if (!this.state.paused) {
      throw Error('Cannot step out of a function while the Pixel VM is running.')
    }

    // unpause while stepping out
    this.state.paused = false
    // as soon as stack size dips lower than initial size (or the machine halts)
    // we have stepped out of the function.
    const currCallStackSize = this.state.retStack.length
    while (
      !this.state.halted &&
      !this.state.paused &&
      this.state.retStack.length >= currCallStackSize
    ) {
      await this.step()
    }
    // pause now that we have stepped out
    this.state.paused = true
  }

  public setWidth(width: number) {
    if (!this.state.halted) throw Error('Cannot set width of Pixel VM screen while it is running.')
    if (this.state.screenHandle.width < width)
      throw RangeError(
        `Cannot set width of Pixel VM screen larger than width of canvas ${this.state.screenHandle.width}`
      )
    this.state.width = width
  }

  public setHeight(height: number) {
    if (!this.state.halted) throw Error('Cannot set height of Pixel VM screen while it is running.')
    if (this.state.screenHandle.height < height)
      throw RangeError(
        `Cannot set height of Pixel VM screen larger than height of canvas ${this.state.screenHandle.height}`
      )
    this.state.height = height
  }

  public getWidth(): number {
    return this.state.width
  }

  public getHeight(): number {
    return this.state.height
  }

  public isHalted(): boolean {
    return this.state.halted
  }
}
