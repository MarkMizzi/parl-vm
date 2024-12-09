<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header
    class="flex flex-wrap md:justify-start md:flex-nowrap sticky top-0 z-50 w-full justify-self-start"
  >
    <nav class="sticky top-0 left-0 w-screen bg-slate-900 px-4 py-2 flex flex-row">
      <div class="flex flex-row justify-start">
        <img alt="Pixel logo" class="logo" width="30" height="30" src="@/assets/logo.svg" />
      </div>
      <div class="flex flex-row justify-end gap-x-4 w-full">
        <RouterLink class="link-green" to="/">home</RouterLink>
        <RouterLink class="link-green" to="/about">about</RouterLink>
        <a href="https://github.com/MarkMizzi/parl-vm">
          <img
            alt="View source on Github"
            class="logo"
            width="30"
            height="30"
            src="@/assets/github-mark-white.svg"
          />
        </a>
      </div>
    </nav>
  </header>

  <RouterView />
</template>
