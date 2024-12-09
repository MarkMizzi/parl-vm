<template>
  <select
    id="select-example-src-code"
    class="w-48 p-2 my-2 bg-slate-900 link-green"
    @input="setCodeToExample(($event.target as any).value)"
  >
    <option class="bg-slate-900 link-green" value="">choose an example...</option>
    <option class="bg-slate-900 link-green" value="random">random</option>
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
  push 3       // push 3 on the operand stack
  jmp          // jmp to instruction 3 ( consume 3 from operand stack )
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
