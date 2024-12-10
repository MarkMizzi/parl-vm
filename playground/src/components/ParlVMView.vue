<script setup lang="ts">
import { onMounted, useTemplateRef, defineExpose, ref, type Ref } from 'vue'
import { type Program, Assembler, ParlVM } from 'parl-vm'
import $toast from '@/toast'

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

function step() {
  vm?.safeStep().catch((error) => {
    $toast.error(`${error}`)
  })
}

function stepOut() {
  vm?.stepOut().catch((error) => {
    $toast.error(`${error}`)
  })
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
  <div class="grid grid-cols-1">
    <div class="flex flex-row justify-start p-2 gap-x-2">
      <div class="flex flex-col gap-y-2 md:h-[80vh]">
        <div class="flex flex-col md:flex-row justify-start md:h-12 gap-y-2 md:gap-y-0 md:gap-x-6">
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
        <canvas
          ref="parl-vm-screen"
          class="relative w-full overflow-auto border-2 content-center border-slate-900"
          width="1000"
          height="1000"
        >
        </canvas>
        <textarea
          ref="parl-vm-logger"
          placeholder="Logs will be printed here..."
          class="w-full h-96 overflow-y-scroll border-0 bg-slate-900 text-slate-100 resize-none"
          readonly
        ></textarea>
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
        <button
          v-if="isHalted || isPaused"
          class="h-8 w-8 p-2 link-green tooltip"
          @click="stepOut()"
        >
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
        <button
          v-if="!isHalted && !isPaused"
          class="h-8 w-8 p-2 link-green tooltip"
          @click="pause()"
        >
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
        <button
          v-if="!isHalted && !isPaused"
          class="h-8 w-8 p-2 link-green tooltip"
          @click="stop()"
        >
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
      </div>
    </div>
  </div>
</template>
