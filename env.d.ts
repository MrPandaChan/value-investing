/// <reference types="vitepress/client" />

declare global {
  interface ImportMetaEnv {
    readonly DEV: boolean
    readonly PROD: boolean
    readonly MODE: string
    readonly BASE_URL: string
    [key: string]: unknown
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent;
  export default component;
}

declare module "vue" {
  export * from "vue";
}
