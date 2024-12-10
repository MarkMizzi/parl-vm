import { type Label, PixIROpcode, PushOperandType, rgbToHex } from './instructions'
import { type Program } from './assembler'

type Frame = Array<number | undefined>

export interface ParlVMState {
  screenHandle: HTMLCanvasElement
  loggerHandle: HTMLTextAreaElement
  frameStack: Array<Frame>
  workStack: Array<number>
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
  private safePop(): number {
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

          this.state.workStack.push(x + y)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.SUB: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x - y)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.MUL: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x * y)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.DIV: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x / y)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.MOD: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x % y)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.INC: {
          const x = this.safePop()

          this.state.workStack.push(x + 1)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.DEC: {
          const x = this.safePop()

          this.state.workStack.push(x - 1)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.OR:
        case PixIROpcode.MAX: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(Math.max(x, y))

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.AND:
        case PixIROpcode.MIN: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(Math.min(x, y))

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.ROUND: {
          const x = this.safePop()

          this.state.workStack.push(Math.round(x))

          // update pc
          this.state.programCounter++
          break
        }

        // get random number
        case PixIROpcode.IRND: {
          const x = this.safePop()

          if (x <= 0) {
            throw RangeError(`Argument to irnd instruction is ${x} <= 0, must be > 0`)
          }

          this.state.workStack.push(Math.round(Math.random() * (x - 1)))

          // update pc
          this.state.programCounter++
          break
        }

        /// Logical operations
        /// ------------------------------------------------------

        case PixIROpcode.NOT: {
          const x = this.safePop()

          this.state.workStack.push(1 - (x > 0 ? 1 : 0))

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.LT: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x < y ? 1 : 0)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.LE: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x <= y ? 1 : 0)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.EQ: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x == y ? 1 : 0)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.NEQ: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x != y ? 1 : 0)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.GT: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x > y ? 1 : 0)

          // update pc
          this.state.programCounter++
          break
        }

        case PixIROpcode.GE: {
          const x = this.safePop()
          const y = this.safePop()

          this.state.workStack.push(x >= y ? 1 : 0)

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
          if (instr.operand?.dtype == PushOperandType.LABEL) {
            const [offset, frame] = instr.operand?.val as Label
            const data = this.state.frameStack[frame][offset]
            if (data == undefined) {
              throw RangeError(`Memory access to undefined location [${offset}:${frame}]`)
            }
            this.state.workStack.push(data)
          } else if (instr.operand?.dtype == PushOperandType.LABEL_W_OFFSET) {
            let [offset, frame] = instr.operand?.val as Label
            const index = this.safePop()

            // add index we obtained from the work stack.
            offset += index
            const data = this.state.frameStack[frame][offset]
            if (data == undefined) {
              throw RangeError(`Memory access to undefined location [${offset}:${frame}]`)
            }
            this.state.workStack.push(data)
          } else if (instr.operand?.dtype == PushOperandType.PCOFFSET) {
            const pcoffset = instr.operand?.val as number
            // push ptr to instruction to work stack, as when we use the pc offset, pc will have changed.
            this.state.workStack.push(pc + pcoffset)
          } else if (instr.operand?.dtype == PushOperandType.FUNCTION) {
            const funcName = instr.operand!.val as string
            if (!this.program.funcs.has(funcName)) {
              throw Error(`Function ${funcName} that does not exist.`)
            }
            this.state.workStack.push(this.program.funcs.get(funcName)!)
          } else {
            this.state.workStack.push(instr.operand!.val as number)
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

          this.state.programCounter = x
          break
        }

        case PixIROpcode.CJMP: {
          const instrptr = this.safePop()
          const cond = this.safePop()

          // update pc
          if (cond != 0) this.state.programCounter = instrptr
          else this.state.programCounter++
          break
        }

        case PixIROpcode.CJMP2: {
          const instrptr = this.safePop()
          const cond = this.safePop()

          // update pc
          if (cond == 0) this.state.programCounter = instrptr
          else this.state.programCounter++
          break
        }

        case PixIROpcode.CALL: {
          const funcLoc = this.safePop()
          const argCount = this.safePop()

          let frame: Frame = []
          for (let i = 0; i < (argCount as number); i++) frame.push(this.safePop())

          this.state.frameStack.unshift(frame)
          this.state.retStack.push(this.state.programCounter + 1)

          this.state.programCounter = funcLoc
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

          for (let i = 0; i < size; i++) this.state.frameStack[0].push(undefined)

          this.state.programCounter++
          break
        }

        case PixIROpcode.OFRAME: {
          const size = this.safePop()

          let frame: Frame = []
          for (let i = 0; i < size; i++) frame.push(undefined)

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
          const frame = this.safePop()
          const location = this.safePop()
          const val = this.safePop()

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

          await sleep(delay)

          this.state.programCounter++
          break
        }

        /// Screen related operations
        /// ------------------------------------------------------

        case PixIROpcode.WRITE: {
          const x = this.safePop()
          const y = this.safePop()
          const c = this.safePop()

          this.fillRect(x, y, 1, 1, c)

          this.state.programCounter++
          break
        }

        case PixIROpcode.WRITEBOX: {
          const x = this.safePop()
          const y = this.safePop()
          const w = this.safePop()
          const h = this.safePop()
          const c = this.safePop()

          this.fillRect(x, y, w, h, c)

          this.state.programCounter++
          break
        }

        case PixIROpcode.CLEAR: {
          const c = this.safePop()

          this.fillRect(0, 0, this.state.width, this.state.height, c)

          this.state.programCounter++
          break
        }

        case PixIROpcode.READ: {
          const x = this.safePop()
          const y = this.safePop()

          let [canvasX, canvasY] = this.scaleCanvas(x, y)
          const [canvasX_, canvasY_] = this.scaleCanvas(x + 1, y + 1)
          // find center of canvas rectangle representing pixel (x, y) of PixelVM screen,
          // this ensures we read from the right region of the canvas despite any floating point rounding errors.
          canvasX = (canvasX + canvasX_) / 2
          canvasY = (canvasY + canvasY_) / 2

          const context = this.state.screenHandle.getContext('2d')
          const imageData = context!.getImageData(canvasX, canvasY, 1, 1).data
          this.state.workStack.push((imageData[0] << 16) | (imageData[1] << 8) | imageData[2])

          this.state.programCounter++
          break
        }

        case PixIROpcode.WIDTH: {
          this.state.workStack.push(this.state.width)

          this.state.programCounter++
          break
        }

        case PixIROpcode.HEIGHT: {
          this.state.workStack.push(this.state.height)

          this.state.programCounter++
          break
        }

        // log output
        case PixIROpcode.PRINT: {
          const x = this.safePop()
          this.state.loggerHandle.value += `${x}\n`

          this.state.programCounter++
          break
        }

        /// Array operations
        /// ------------------------------------------------------

        case PixIROpcode.DUPA: {
          const x = this.safePop()
          const count = this.safePop()

          for (let i: number = 0; i < count; i++) {
            this.state.workStack.push(x)
          }

          this.state.programCounter++
          break
        }

        case PixIROpcode.STA: {
          const frame = this.safePop()
          const location = this.safePop()
          const count = this.safePop()

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
          const count = this.safePop()

          if (instr.operand?.dtype == PushOperandType.LABEL) {
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
          const count = this.safePop()

          for (let i: number = 0; i < count; i++) {
            this.state.loggerHandle.value += `${this.safePop()}\n`
          }

          this.state.programCounter++
          break
        }

        case PixIROpcode.RETA: {
          const count = this.safePop()

          let buf: number[] = []
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

          this.state.workStack.push(val)

          this.state.programCounter++
          break
        }

        case PixIROpcode.PUTCHAR: {
          const x = this.safePop()

          const charCode = Math.round(x)
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
