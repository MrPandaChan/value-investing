import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
import BasicRevenueTable from "../components/table/basic-revenue-table.vue";
import CostsExpensesTable from "../components/table/costs-expenses-table.vue";
import BalanceTable from "../components/table/balance-table.vue";
import WorkingCapitalTable from "../components/table/working-capital-table.vue";
import FixedAssetInvestmentAnalysisTable from "../components/table/fixed-asset-investment-analysis-table.vue";
import ReturnTable from "../components/table/return-table.vue";
import TurnoverRateTable from "../components/table/turnover-rate-table.vue";
import PrimaryBusinessTable from "../components/table/primary-business-table.vue";
import CompareDataTable from "../components/table/compare-data-table.vue";
import CompareReturnTable from "../components/table/compare-return-table.vue";
import CompareTurnoverRateTable from "../components/table/compare-turnover-rate-table.vue";
import ComparePrimaryBusinessTable from "../components/table/compare-primary-business-table.vue";
import ProfitValuation from "../components/valuation/profit-valuation.vue";
import ProfitValuationGroup from "../components/valuation/profit-valuation-group.vue";
import Portfolio from "../components/portfolio/portfolio.vue";
import ValuationEvaluation from "../components/value-evaluation/value-evaluation.vue";
import "./custom.scss";
import "./shared.scss";

const define = <T>(value: T): T => value;

export default define<Theme>({
  extends: DefaultTheme,
  enhanceApp: async ({ app }) => {
    // 注册 Element Plus
    app.use(ElementPlus);

    // 基础财务分析
    app.component("BasicRevenueTable", BasicRevenueTable);
    app.component("CostsExpensesTable", CostsExpensesTable);
    app.component("BalanceTable", BalanceTable);
    app.component("WorkingCapitalTable", WorkingCapitalTable);
    app.component(
      "FixedAssetInvestmentAnalysisTable",
      FixedAssetInvestmentAnalysisTable,
    );
    app.component("ReturnTable", ReturnTable);
    app.component("TurnoverRateTable", TurnoverRateTable);
    app.component("PrimaryBusinessTable", PrimaryBusinessTable);

    // 同行对比
    app.component("CompareDataTable", CompareDataTable);
    app.component("CompareReturnTable", CompareReturnTable);
    app.component("CompareTurnoverRateTable", CompareTurnoverRateTable);
    app.component("ComparePrimaryBusinessTable", ComparePrimaryBusinessTable);

    // 估值
    app.component("ProfitValuation", ProfitValuation);
    app.component("ProfitValuationGroup", ProfitValuationGroup);

    // 持仓组合透视盈余
    app.component("Portfolio", Portfolio);

    // 价值评估模型
    app.component("ValuationEvaluation", ValuationEvaluation);
  },
});
