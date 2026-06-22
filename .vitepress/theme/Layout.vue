<script setup>
import DefaultTheme from "vitepress/theme";
import BackToTop from "../components/back-to-top/back-to-top.vue";
import CompanyMenu from "../components/company-menu/company-menu.vue";

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #doc-before>
      <CompanyMenu />
    </template>
    <template #layout-bottom>
      <BackToTop />
    </template>
  </Layout>
</template>
