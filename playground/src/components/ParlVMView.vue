<script setup lang="ts">
import { onMounted, useTemplateRef, defineExpose, ref } from 'vue'
import { type Program, Assembler, ParlVM } from 'parl-vm'
import $toast from '@/toast'
import DebuggerConsole from './DebuggerConsole.vue'

export interface ParlVMViewData {
  program: Program
  assembler: Assembler
  vm: ParlVM | undefined
}

let assembler = new Assembler()
let vm: ParlVM | undefined = undefined

const screenRef = useTemplateRef('parl-vm-screen')
const loggerRef = useTemplateRef('parl-vm-logger')

// is the VM executing instructions rn?
// No if machine has halted, not been started or is paused.
const isHalted = ref(true)
// Has the machine been paused by the user?
const isPaused = ref(false)
// Should the debugger console be shown?
const showDebugger = ref(false)

const currScreenWidth = ref(0)
const currScreenHeight = ref(0)

const newScreenWidthInput = ref('')
const newScreenHeightInput = ref('')

onMounted(() => {
  vm = new ParlVM(screenRef.value as HTMLCanvasElement, loggerRef.value as HTMLTextAreaElement)
  currScreenWidth.value = vm!.getWidth()
  currScreenHeight.value = vm!.getHeight()
  /* Set callbacks to update isRunning and isPaused refs accordingly */
  vm!.onPausedChange = (p) => {
    isPaused.value = p
  }
  vm!.onHaltedChange = (h) => {
    isHalted.value = h
  }
})

function setNewWidth() {
  const newScreenWidth = parseInt(newScreenWidthInput.value, 10)
  if (isNaN(newScreenWidth)) {
    $toast.error(`${newScreenWidthInput.value} is invalid width: Must enter number.`)
    return
  }

  if (newScreenWidth <= 0) {
    $toast.error('New screen width must be > 0.')
    return
  }

  if (vm) {
    try {
      vm.setWidth(newScreenWidth)
    } catch (error) {
      $toast.error(`${error}`)
    }
    currScreenWidth.value = vm.getWidth()
  }
}

function setNewHeight() {
  const newScreenHeight = parseInt(newScreenHeightInput.value, 10)
  if (isNaN(newScreenHeight)) {
    $toast.error(`${newScreenHeightInput.value} is invalid height: Must enter number.`)
    return
  }

  if (newScreenHeight <= 0) {
    $toast.error('New screen height must be > 0.')
    return
  }

  if (vm) {
    try {
      vm.setHeight(newScreenHeight)
    } catch (error) {
      $toast.error(`${error}`)
    }
    currScreenHeight.value = vm.getHeight()
  }
}

function setProgram(asm: string) {
  vm?.load(assembler.assemble(asm))
}

function stop() {
  vm?.stop()
}

function pause() {
  vm?.pause()
}

function runOrContinue() {
  if (isPaused.value) {
    vm?.continue().catch((error) => {
      $toast.error(`${error}`)
    })
  } else {
    vm?.run().catch((error) => {
      $toast.error(`${error}`)
    })
  }
}

defineExpose({
  setProgram
})
</script>

<template>
  <div class="w-full p-2 flex flex-row justify-start gap-x-2">
    <div class="md:h-[80vh] w-full flex flex-col gap-y-2">
      <DebuggerConsole v-if="showDebugger" class="peer h-2/6 w-full" :vm="vm" />
      <div
        class="w-full flex flex-col md:flex-row justify-start md:h-12 gap-y-2 md:gap-y-0 md:gap-x-6"
      >
        <p class="text-sm my-auto">
          <span class="italic">width x height: </span>
          {{ currScreenWidth }} x {{ currScreenHeight }}
        </p>
        <form class="flex flex-row justify-start gap-x-2">
          <div class="flex flex-col content-start">
            <label class="text-sm italic">set width:</label>
            <input
              v-model="newScreenWidthInput"
              type="number"
              class="bg-slate-900 text-slate-100 text-sm py-0 my-0 w-24"
            />
          </div>
          <button class="link-green" type="button" @click="setNewWidth()">update</button>
        </form>
        <form class="flex flex-row justify-start gap-x-2">
          <div class="flex flex-col content-start">
            <label class="text-sm italic">set height:</label>
            <input
              v-model="newScreenHeightInput"
              type="number"
              class="bg-slate-900 text-slate-100 text-sm py-0 my-0 w-24"
            />
          </div>
          <button class="link-green" type="button" @click="setNewHeight()">update</button>
        </form>
      </div>
      <div
        class="flex flex-col md:flex-row w-full h-full peer-[]:h-4/6 justify-start gap-y-2 md:gap-y-0 md:gap-x-2"
      >
        <canvas
          ref="parl-vm-screen"
          class="relative w-full max-h-full overflow-auto border-2 content-center border-slate-900"
          width="1000"
          height="1000"
        >
        </canvas>
        <textarea
          ref="parl-vm-logger"
          placeholder="Logs go here..."
          class="w-full max-h-full md:w-80 overflow-y-scroll border-0 bg-slate-900 text-slate-100 font-mono resize-none"
          readonly
        ></textarea>
      </div>
    </div>
    <div class="flex flex-col gap-x-0">
      <button
        v-if="isHalted || isPaused"
        class="h-8 w-8 p-2 link-green tooltip"
        @click="runOrContinue()"
      >
        <div class="tooltip-text">Run</div>
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
            d="M4.25 3l1.166-.624 8 5.333v1.248l-8 5.334-1.166-.624V3zm1.5 1.401v7.864l5.898-3.932L5.75 4.401z"
          />
        </svg>
      </button>
      <button v-if="!isHalted && !isPaused" class="h-8 w-8 p-2 link-green tooltip" @click="pause()">
        <div class="tooltip-text">Pause</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="1.6rem"
          height="1.6rem"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M10.5 6H6V18H10.5V6ZM7.5 16.5V7.5H9V16.5H7.5ZM18 6H13.5V18H18V6ZM15 16.5V7.5H16.5V16.5H15Z"
            fill="hsla(160, 100%, 37%, 1)"
          />
        </svg>
      </button>
      <button v-if="!isHalted && !isPaused" class="h-8 w-8 p-2 link-green tooltip" @click="stop()">
        <div class="tooltip-text">Halt</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          width="1.6rem"
          height="1.6rem"
          viewBox="0 0 76 76"
          version="1.1"
          baseProfile="full"
          enable-background="new 0 0 76.00 76.00"
          xml:space="preserve"
        >
          <rect
            x="24"
            y="24"
            fill="hsla(160, 100%, 37%, 1)"
            fill-opacity="1"
            stroke-width="0.2"
            stroke-linejoin="round"
            width="28"
            height="28"
          />
        </svg>
      </button>
      <button class="h-8 w-8 p-2 link-green tooltip" @click="showDebugger = !showDebugger">
        <div class="tooltip-text">Show/Hide Debugger</div>
        <svg xmlns="http://www.w3.org/2000/svg" width="1.6rem" height="1.6rem" viewBox="0 0 24 24">
          <path
            fill="hsla(160, 100%, 37%, 1)"
            d="M4.6 15c-.9-2.6-.6-4.6-.5-5.4 2.4-1.5 5.3-2 8-1.3.7-.3 1.5-.5 2.3-.6-.1-.3-.2-.5-.3-.8h2l1.2-3.2-.9-.4-1 2.6h-1.8C13 4.8 12.1 4 11.1 3.4l2.1-2.1-.7-.7L10.1 3c-.7 0-1.5 0-2.3.1L5.4.7l-.7.7 2.1 2.1C5.7 4.1 4.9 4.9 4.3 6H2.5l-1-2.6-.9.4L1.8 7h2C3.3 8.3 3 9.6 3 11H1v1h2c0 1 .2 2 .5 3H1.8L.6 18.3l.9.3 1-2.7h1.4c.4.8 2.1 4.5 5.8 3.9-.3-.2-.5-.5-.7-.8-2.9 0-4.4-3.5-4.4-4zM9 3.9c2 0 3.7 1.6 4.4 3.8-2.9-1-6.2-.8-9 .6.7-2.6 2.5-4.4 4.6-4.4zm14.8 19.2l-4.3-4.3c2.1-2.5 1.8-6.3-.7-8.4s-6.3-1.8-8.4.7-1.8 6.3.7 8.4c2.2 1.9 5.4 1.9 7.7 0l4.3 4.3c.2.2.5.2.7 0 .2-.2.2-.5 0-.7zm-8.8-3c-2.8 0-5.1-2.3-5.1-5.1s2.3-5.1 5.1-5.1 5.1 2.3 5.1 5.1-2.3 5.1-5.1 5.1z"
          />
          <path fill="none" d="M0 0h24v24H0z" />
        </svg>
      </button>
    </div>
  </div>
</template>
