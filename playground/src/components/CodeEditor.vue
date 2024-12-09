<script lang="ts">
import { defineComponent, type DefineComponent } from 'vue'
import { Codemirror } from 'vue-codemirror'
import { cobalt } from 'thememirror'
import { type Extension } from '@codemirror/state'

// eslint-disable-next-line
export default defineComponent({
  components: {
    Codemirror
  },
  props: {
    readonly: { type: Boolean, required: true }
  },
  data() {
    return {
      code: '',
      extensions: [cobalt]
    }
  },
  methods: {
    setCode(code: string) {
      this.code = code
    },
    getCode(): string {
      return this.code
    },
    addExtension(extension: Extension) {
      this.extensions.push(extension)
    }
  }
}) as DefineComponent<
  { readonly: boolean },
  {},
  { code: string; extensions: Extension[] },
  {},
  { addExtension: (extension: Extension) => void; setCode: (code: string) => void }
>
</script>

<template>
  <codemirror
    ref="codemirror"
    v-model="code"
    placeholder=""
    :style="{ height: '80vh' }"
    :indent-with-tab="true"
    :tab-size="2"
    :extensions="extensions"
    :disabled="readonly"
  />
</template>
