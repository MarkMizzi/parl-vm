<template>
  <main>
    <div class="w-full xl:w-4/6 mx-auto flex flex-col md:flex-row h-full">
      <div class="flex flex-row">
        <div class="w-full md:w-96 overflow-scroll">
          <AsmView ref="asmView"></AsmView>
        </div>
        <div class="flex flex-col p-2 gap-x-0">
          <button class="h-8 w-8 p-2 link-green tooltip" @click="assemble()">
            <div class="tooltip-text">Assemble</div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1.6rem"
              height="1.6rem"
              viewBox="0 0 512 512"
            >
              <title>ionicons-v5-h</title>
              <path
                d="M393.87,190a32.1,32.1,0,0,1-45.25,0l-26.57-26.57a32.09,32.09,0,0,1,0-45.26L382.19,58a1,1,0,0,0-.3-1.64c-38.82-16.64-89.15-8.16-121.11,23.57-30.58,30.35-32.32,76-21.12,115.84a31.93,31.93,0,0,1-9.06,32.08L64,380a48.17,48.17,0,1,0,68,68L285.86,281a31.93,31.93,0,0,1,31.6-9.13C357,282.46,402,280.47,432.18,250.68c32.49-32,39.5-88.56,23.75-120.93a1,1,0,0,0-1.6-.26Z"
                style="
                  fill: none;
                  stroke: hsla(160, 100%, 37%, 1);
                  stroke-linecap: round;
                  stroke-miterlimit: 10;
                  stroke-width: 32px;
                "
              />
              <circle cx="96" cy="416" r="16" />
            </svg>
          </button>
        </div>
      </div>
      <ParlVMView ref="parlVMView"></ParlVMView>
    </div>
  </main>
</template>

<script lang="ts">
import AsmView from '@/components/AsmView.vue'
import ParlVMView from '@/components/ParlVMView.vue'
import { defineComponent } from 'vue'
import $toast from '@/toast'

export default defineComponent({
  components: {
    AsmView,
    ParlVMView
  },
  methods: {
    // assemble code contained in the Assembly view at the behest of the user.
    // DO NOT use this function for compiled Pixel asm code
    assemble() {
      const asmView = this.$refs.asmView as typeof AsmView
      const parlVMView = this.$refs.parlVMView as typeof ParlVMView

      try {
        // load the assembly code in the assembly view into the VM
        const content = asmView.getContent()
        parlVMView.setProgram(content)
        $toast.success('Assembled and loaded program.')
      } catch (error) {
        $toast.error(`${error}`)
      }
    }
  }
})
</script>
