---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "Value Investing"
  text: "A VitePress Site"
  tagline: My great project tagline
  actions:
    - theme: brand
      text: 研究中的行业和企业
      link: /industry-overview
    - theme: alt
      text: 待办清单
      link: /value-investing/getting-started/todo

features:
  - title: 投研步骤
    details: 研究 ➡️ 提取投资逻辑 ➡️ 纳入股票池并评级 ➡️ 每周跟踪并等待击球区

---

<IndustryOverview />

<style>
.VPHome .vp-doc {
  max-width: 100vw !important;
}
</style>