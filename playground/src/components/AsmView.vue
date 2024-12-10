<template>
  <select
    id="select-example-src-code"
    class="w-48 p-2 my-2 bg-slate-900 link-green"
    @input="setCodeToExample(($event.target as any).value)"
  >
    <option class="bg-slate-900 link-green" value="">choose an example...</option>
    <option class="bg-slate-900 link-green" value="random">random</option>
    <option class="bg-slate-900 link-green" value="array max">array max</option>
  </select>
  <CodeEditor
    ref="assemblyEditor"
    v-model="content"
    class="border-2 border-slate-700"
    :readonly="false"
    mode="null"
  ></CodeEditor>
</template>

<script lang="ts">
import { parlAsm } from '@/parl-extensions'
import CodeEditor from './CodeEditor.vue'
import { defineComponent } from 'vue'

export default defineComponent({
  components: {
    CodeEditor
  },
  data() {
    return {
      content: '',
      codeExamples: new Map([
        ['', ''],
        [
          'random',
          `.main          // this is the entry point into the program
  push 4       // push 4 on the operand stack
  jmp          // jmp to instruction 4 ( consume 4 from operand stack )
  halt         // every program has a halt ... to quit
  push 1       // the program needs to allocate space for 1 variable
  oframe       // open frame - allocate space for variab
  push 0       // value to store in c
  push 0       // location index in the frame
  push 0       // location level in the memory stack
  st           // store 0 at index 0 of the frame located at level 0
  push 1       // for loop - requires allocation for one variable .
  oframe       // open a new frame - allocate space for variable i
  push 0       // counter starts at 0
  push 0       // location index in frame
  push 0       // local level in memory stack
  st           // store the value 0 to i .
  push 64      // evaluate conditional expression. push 64
  push [0:0]   // push value of i - from index 0 , level 0
  lt           // push 1 or 0 depending on result of lt
  push #PC+4   // push current program counter+4 to stay in the loop
  cjmp         // update program counter if 1 to #PC+4 ( stay in loop )
  push #PC+22  // push current program counter+22 to exit loop
  jmp          // update program counter to exit loop
  push 0       // 0 new variables on the { } scope
  oframe       // open frame for { } block , no space allocations required
  push 1677216 // push max value for random operator
  irnd         // pop 1677216 from stack and push random int value
  push 0       // location index 0 in frame of variable c
  push 2       // location level 2 in memory stack for variable c .
  st           // store random int value to c
  push [0:2]   // impl of clear inst. first push value of var c
  clear        // then clear the display with that value
  push 16      // impl. o f delay in st. first push 16
  delay        // call delay for 16 millisecond
  cframe       // close block { } frame
  push 1       // push 1
  push [0:0]   // push value of i
  add          // add i+1
  push 0       // location index in frame of i
  push 0       // location level of the frame
  st           // store the new value (i + 1) to i
  push #PC-25  // push instruction location at expr. eval. of loop
  jmp          // update program counter
  cframe       // close frame for loop
  cframe       // close frame main program
  halt         // exit the program`
        ],
        [
          'array max',
          `.main
  push 4
  jmp
  halt
  push 10     // make space for array
  oframe
  push #PC+52
  jmp
.MaxInArray   // start of MaxInArray function instructions
  push 9      // number of local variables. 9 is over-allocating.
  alloc       // create the space for variable m
  push 0      // initial value of variable m
  push 8      // location index in frame - following array
  push 0      // frame level in memory stack
  st          // store 0 to m
  push 1      // for loop variables between ( ). Just i here.
  oframe      // create a new scope and allocate space for i
  push 0      // initial value of i
  push 0      // index of i in the frame
  push 0      // location of frame in memory stack
  st          // store value 0 to i
  push 8      // start of < evaluation. push RHS operand
  push [0]    // push LHS operand
  lt          // carry out operation
  push #PC+4  // start of instructions implementing for block
  cjmp        // if true jump
  push #PC+29 // instruction location if condition is false
  jmp         // go the exit of the for loop.
  push 0      // no new local variables in the for block
  oframe      // create a new frame for the for loop block
  push [8:2]  // push value of m
  push [0:1]  // push value of i
  push +[0:2] // push value of x of f set by index i.
  gt          // compare x[i] with m
  push #PC+4  // push instruction line number if true
  cjmp        // jump if this is true
  push #PC+10 // push instruction line number if false
  jmp         // jump
  push 0      // if true, scope has no new local variables
  oframe      // create the scope for the if true block
  push [0:2]  // push value of i (note frame level is now 2)
  push +[0:3] // push value of x at idx i (note frame level is 3)
  push 8      // push location of m in frame
  push 3      // push frame level where m is stored
  st          // update value of m
  cframe      // close frame (if true block)
  cframe      // close frame (for loop)
  push 1      // start of instructions for i=i+1; push 1
  push [0]    // push value of i
  add         // add i and 1
  push 0      // location index in frame for variable i
  push 0      // frame level in the memory stack
  st          // assign the new value of i
  push #PC-32 // push line number of bool expression of the for loop
  jmp         // jump
  cframe      // close function frame
  push [8]    // push value of m
  ret         // return from function
  push 21     // push last array value
  push 34     // push array value
  push 120    // push array value
  push 99     // push array value
  push 65     // push array value
  push 3      // push array value
  push 54     // push array value
  push 23     // push array value
  push 8      // push size of array
  push 1      // push index in frame where array starts
  push 0      // push frame level on memory stack
  sta         // pop all 8 array value s and store them
  push 8      // prepare for call - push size of array
  pusha [1]   // push array values starting at index 1
  push 8      // 8 values are passed to MaxInArray function
  push .MaxInArray // push line number of instruction starting function
  call        // call function .. update program counter
  push 9      // location index in frame for variable max
  push 0      // location level in memory stack
  st          // store value to max
  push [9]    // push value of max
  print       // print to the console
  cframe      // close program frame
  halt        // exit program`
        ]
      ])
    }
  },
  mounted() {
    // add pixel ASM extension to the code editor.
    const assemblyEditor = this.$refs.assemblyEditor
    ;(assemblyEditor as typeof CodeEditor).addExtension(parlAsm())
    this.setContent('// Compile a program')
  },
  methods: {
    setContent(assembly: string) {
      this.content = assembly
    },
    getContent(): string {
      return this.content
    },
    setCodeToExample(exampleName: string) {
      this.setContent(this.$data.codeExamples.get(exampleName)!)
    }
  }
})
</script>
