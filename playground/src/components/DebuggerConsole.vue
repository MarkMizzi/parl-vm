<script setup lang="ts">
import { ParlVM } from 'parl-vm'
import $toast from '@/toast'
import { onMounted, ref, useTemplateRef } from 'vue'

const debugCommand = ref('')

const debuggerConsole = useTemplateRef('parl-vm-debugger-console')

/* Function to parse debugging commands */
function parseDebugCommand() {
  if (debugCommand.value.match(/^br?e?a?k?\s+\d+$/)) {
    const breakpoint = parseInt(debugCommand.value.split(/\s+/, 2)[1])
    if (props.vm?.setBreakpoint(breakpoint)) $toast.success(`Set breakpoint at ${breakpoint}.`)
    else $toast.warning(`Breakpoint has already been set at ${breakpoint}.`)
    return
  }

  if (debugCommand.value.match(/^de?l?e?t?e?\s+\d+$/)) {
    const breakpoint = parseInt(debugCommand.value.split(/\s+/, 2)[1])
    if (props.vm?.deleteBreakpoint(breakpoint))
      $toast.success(`Deleted breakpoint at ${breakpoint}.`)
    else $toast.warning(`There was no breakpoint at ${breakpoint}.`)
    return
  }

  if (debugCommand.value.match(/^li?s?t?$/)) {
    debuggerConsole.value!.innerHTML +=
      (props.vm?.printBreakpoints() || 'No breakpoints are set.') + '\n'
    return
  }

  if (debugCommand.value.match(/^pr?i?n?t?\s+.*$/)) {
    console.log(debugCommand.value)
    const query = debugCommand.value.split(/\s+/, 2)[1]
    try {
      debuggerConsole.value!.innerHTML += props.vm?.printState(query) + '\n' || ''
    } catch (e) {
      $toast.error(`Could not print state: ${e}`)
    }
    return
  }

  if (debugCommand.value.match(/^he?l?p?$/)) {
    debuggerConsole.value!.innerHTML += `break  <Breakpoint>                  Sets a breakpoint at specified program location
delete <Breakpoint>                  Deletes a breakpoint set at program location <Breakpoint>
list                                 Lists all breakpoints currently set
print  #PC                           Print the current value of the program counter
print  workStack                     Print the current work stack
print  workStack.len                 Print the current size of the work stack
print  workStack[<Idx>]              Print the value of the work stack at <Idx>
print  workStack[<Start>?..<End>?]   Print the specified range of values of the work stack
print  retStack                      Print the current return pointer stack
print  retStack.len                  Print the current size of the return pointer stack
print  retStack[<Idx>]               Print the value of the return pointer stack at <Idx>
print  retStack[<Start>?..<End>?]    Print the specified range of values of the return pointer stack
print  [<Idx>:<Frame>]               Print the memory location specified by [<Idx>:<Frame>]
print  [<Idx>]                       Print the memory location specified by [<Idx>:0]
print  [:<Frame>]                    Print the contents of frame <Frame>
print  [:]                           Print the entire frame stack
print  [:].len                       Print the number of frames in the frame stack
`
    return
  }

  $toast.error('Invalid debugger command. Type help to see a list of available commands.')
}

const props = defineProps<{ vm?: ParlVM }>()

function step() {
  props.vm
    ?.safeStep()
    .then(() => {
      debuggerConsole.value!.innerHTML += `Stepped to instruction at ${props.vm!.programCounter + 1}\n`
    })
    .catch((error) => {
      $toast.error(`${error}`)
    })
}

function stepOut() {
  props.vm?.stepOut().catch((error) => {
    $toast.error(`${error}`)
  })
}

// is the VM executing instructions rn?
// No if machine has halted, not been started or is paused.
const isHalted = ref(true)
// Has the machine been paused by the user?
const isPaused = ref(false)

onMounted(() => {
  /* Set callbacks to update isRunning and isPaused refs accordingly */
  props.vm!.onPausedChange = (p) => {
    isPaused.value = p
  }
  props.vm!.onHaltedChange = (h) => {
    isHalted.value = h
  }
  props.vm!.onBreakpoint = (breakpoint) => {
    debuggerConsole.value!.innerHTML += `Paused VM at breakpoint ${breakpoint}\n`
  }
})
</script>

<template>
  <div class="flex flex-row gap-x-2">
    <div class="flex flex-col w-full gap-x-0">
      <textarea
        ref="parl-vm-debugger-console"
        placeholder="Debugger console... Type help to see options"
        class="w-full h-64 overflow-auto text-nowrap text-xs border-0 bg-slate-900 text-slate-50 font-mono resize-none"
        readonly
      ></textarea>
      <form
        @submit="
          (e) => {
            e.preventDefault()
            parseDebugCommand()
            debugCommand = ''
          }
        "
      >
        <input
          v-model="debugCommand"
          type="text"
          class="bg-slate-900 text-slate-50 text-xs my-2 w-full font-mono"
          placeholder="Enter debug command..."
        />
      </form>
    </div>
    <div class="flex flex-col justify-start">
      <button v-if="isHalted || isPaused" class="h-8 w-8 p-2 link-green tooltip" @click="step()">
        <div class="tooltip-text">Step</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1.6rem"
          height="1.6rem"
          viewBox="0 0 16 16"
          fill="hsla(160, 100%, 37%, 1)"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M14.25 5.75v-4h-1.5v2.542c-1.145-1.359-2.911-2.209-4.84-2.209-3.177 0-5.92 2.307-6.16 5.398l-.02.269h1.501l.022-.226c.212-2.195 2.202-3.94 4.656-3.94 1.736 0 3.244.875 4.05 2.166h-2.83v1.5h4.163l.962-.975V5.75h-.004zM8 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
          />
        </svg>
      </button>
      <button v-if="isHalted || isPaused" class="h-8 w-8 p-2 link-green tooltip" @click="stepOut()">
        <div class="tooltip-text">Step Out</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1.6rem"
          height="1.6rem"
          viewBox="0 0 16 16"
          fill="hsla(160, 100%, 37%, 1)"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M8 1h-.542L3.553 4.905l1.061 1.06 2.637-2.61v6.177h1.498V3.355l2.637 2.61 1.061-1.06L8.542 1H8zm1.956 12.013a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
          />
        </svg>
      </button>
    </div>
  </div>
</template>
