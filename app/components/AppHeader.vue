<template>
  <div class="fixed top-5 left-5 z-50">
    <UTooltip
      text="Change theme"
      :content="{
        align: 'center',
        side: 'right',
        sideOffset: 8,
      }"
    >
      <UColorModeButton
        color="gray"
        variant="ghost"
        size="xl"
        square
        :padded="false"
        class="w-11 h-11 rounded-full flex items-center justify-center shadow-lg backdrop-blur-xl bg-white/10 dark:bg-black/10 transition-all duration-200 ease-out hover:scale-110 hover:bg-white/25 dark:hover:bg-black/25 hover:shadow-xl active:scale-95 active:duration-150"
      >
        <div class="relative w-6 h-6">
          <transition
            name="icon-shift"
            mode="out-in"
          >
            <UIcon
              :key="colorMode.value"
              :name="colorMode.value === 'dark' ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'"
              class="absolute inset-0 w-6 h-6 text-primary"
            />
          </transition>
        </div>
      </UColorModeButton>
    </UTooltip>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
</script>

<style scoped>
.icon-shift-enter-active,
.icon-shift-leave-active {
  transition: all 200ms ease-out;
}
.icon-shift-enter-from {
  opacity: 0;
  transform: rotate(120deg) scale(0);
}
.icon-shift-leave-to {
  opacity: 0;
  transform: rotate(-120deg) scale(0);
}
</style>