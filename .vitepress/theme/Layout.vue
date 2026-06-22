<script setup>
import DefaultTheme from "vitepress/theme";
import BackToTop from "../components/back-to-top/back-to-top.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #layout-bottom>
      <BackToTop />
    </template>
  </Layout>
</template>
