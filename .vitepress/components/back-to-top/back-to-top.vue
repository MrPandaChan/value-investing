<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from "vue";

const visible = ref(false);

let scrollHandler: (() => void) | null = null;

onMounted(() => {
  scrollHandler = () => {
    visible.value = window.scrollY > 300;
  };
  window.addEventListener("scroll", scrollHandler, { passive: true });
});

onUnmounted(() => {
  if (scrollHandler) {
    window.removeEventListener("scroll", scrollHandler);
  }
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
</script>

<template>
  <button
    v-show="visible"
    class="back-to-top"
    title="回到顶部"
    @click="scrollToTop"
  >
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
      <path
        d="M10 3.22L3.53 9.69l1.06 1.06L10 5.34l5.41 5.41 1.06-1.06L10 3.22zM9 16h2V7h-2v9z"
      />
    </svg>
  </button>
</template>

<style scoped>
.back-to-top {
  position: fixed;
  bottom: 60px;
  right: 40px;
  z-index: 100;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    opacity 0.3s,
    transform 0.3s;
  opacity: 0.8;
}

.back-to-top:hover {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-color: var(--vp-c-brand-1);
  color: var(--vp-c-brand-1);
}
</style>
