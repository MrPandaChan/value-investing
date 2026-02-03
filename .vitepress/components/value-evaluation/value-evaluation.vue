<template>
  <div class="value-evaluation">
    <!-- 数据验证警告 -->
    <div v-if="validationWarnings.length > 0" class="validation-warnings">
      <el-alert
        v-for="(warning, index) in validationWarnings"
        :key="index"
        type="warning"
        :closable="false"
        :show-icon="true"
        style="margin-bottom: 8px"
      >
        {{ warning }}
      </el-alert>
    </div>

    <!-- 雷达图 -->
    <div class="radar-chart-container">
      <div ref="radarChartRef" class="radar-chart"></div>
    </div>

    <table class="evaluation-table">
      <thead>
        <tr>
          <th class="element-col">评估要素</th>
          <th class="description-col">说明/判断标准</th>
          <th class="example-col">示例/参考标准</th>
          <th class="score-col">分值</th>
          <th class="input-col"></th>
        </tr>
      </thead>
      <tbody>
        <template
          v-for="(category, categoryIndex) in evaluationData"
          :key="category.id"
        >
          <!-- 类别标题行 -->
          <tr class="category-separator">
            <td colspan="3">{{ categoryIndex + 1 }}. {{ category.name }}</td>
            <td class="score-col">{{ getCategoryMaxScore(category) }}</td>
            <td class="input-col">
              {{ getCategoryScore(category) }}/{{
                getCategoryMaxScore(category)
              }}
            </td>
          </tr>

          <!-- 类别的数据行 -->
          <tr v-for="item in category.items" :key="item.name">
            <td class="element-col">{{ item.name }}</td>
            <td class="description-col">{{ item.description }}</td>
            <td class="example-col">{{ item.example }}</td>
            <td class="score-col">{{ item.maxScore }}</td>
            <td class="input-col">
              <el-input-number
                v-model="item.userScore"
                :min="0"
                :max="item.maxScore"
                :precision="0"
                :step="1"
                controls-position="right"
                @change="handleScoreChange"
              />
            </td>
          </tr>
        </template>

        <!-- 总分行 -->
        <tr class="total-separator">
          <td colspan="3" class="total-label">总分</td>
          <td class="score-col">{{ totalMaxScore }}</td>
          <td class="input-col">{{ totalScore }}/{{ totalMaxScore }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import * as echarts from "echarts";

// External JSON data format definition
/**
 * External data uses category IDs and evaluation item keys (in English) to specify scores
 * Score range is 0 to the max score of the item, values outside this range will be clamped
 *
 * Category IDs:
 * - moat: Company Moat (企业护城河)
 * - management: Management Team (管理团队)
 * - industry: Industry Position (行业地位)
 * - businessModel: Business Model (商业模式)
 * - governance: Corporate Governance (公司治理)
 * - product: Product Demand (产品需求)
 * - culture: Corporate Culture (企业文化)
 * - adaptability: External Adaptability (外部适应性)
 *
 * Example data:
 */
/*
const exampleScoreData = {
  moat: {
    brandValue: 4,
    costAdvantage: 4,
    networkEffect: 3,
    switchingCost: 3,
    patentBarrier: 4
  },
  management: {
    integrity: 4,
    strategicVision: 3,
    ownershipStructure: 2,
    capitalAllocation: 2
  },
  industry: {
    marketPosition: 4,
    growthPotential: 2,
    competitionLandscape: 4,
    policyEnvironment: 2
  },
  businessModel: {
    profitModel: 5,
    scalability: 5,
    cashFlow: 5
  },
  governance: {
    boardIndependence: 4,
    informationDisclosure: 3,
    legalRisk: 3
  },
  product: {
    demandStability: 2,
    userStickiness: 2,
    innovationCapability: 2
  },
  culture: {
    longTermOrientation: 3,
    customerFocus: 2,
    employeeSatisfaction: 2
  },
  adaptability: {
    cyclicalResilience: 3,
    internationalRisk: 3,
    disruptionRisk: 4
  }
}
*/

interface ExternalScoreData {
  moat: {
    brandValue: number;
    costAdvantage: number;
    networkEffect: number;
    switchingCost: number;
    patentBarrier: number;
  };
  management: {
    integrity: number;
    strategicVision: number;
    ownershipStructure: number;
    capitalAllocation: number;
  };
  industry: {
    marketPosition: number;
    growthPotential: number;
    competitionLandscape: number;
    policyEnvironment: number;
  };
  businessModel: {
    profitModel: number;
    scalability: number;
    cashFlow: number;
  };
  governance: {
    boardIndependence: number;
    informationDisclosure: number;
    legalRisk: number;
  };
  product: {
    demandStability: number;
    userStickiness: number;
    innovationCapability: number;
  };
  culture: {
    longTermOrientation: number;
    customerFocus: number;
    employeeSatisfaction: number;
  };
  adaptability: {
    cyclicalResilience: number;
    internationalRisk: number;
    disruptionRisk: number;
  };
}

// Props 定义
interface Props {
  scoreData?: ExternalScoreData;
}

const props = defineProps<Props>();

// 评估要素类型定义
interface EvaluationItem {
  key: string;
  name: string;
  description: string;
  example: string;
  maxScore: number;
  userScore: number;
}

interface EvaluationCategory {
  id: string;
  name: string;
  items: EvaluationItem[];
}

// 默认数据结构
const defaultEvaluationData: EvaluationCategory[] = [
  {
    id: "moat",
    name: "企业护城河",
    items: [
      {
        key: "brandValue",
        name: "品牌价值",
        description: "是否具有高认知度与客户忠诚度",
        example: "可口可乐（品牌溢价）、苹果（粉丝文化）",
        maxScore: 6,
        userScore: 0,
      },
      {
        key: "costAdvantage",
        name: "成本优势",
        description: "是否具有持续低于行业的成本结构",
        example: "沃尔玛（供应链效率）、西南航空（运营成本）",
        maxScore: 5,
        userScore: 0,
      },
      {
        key: "networkEffect",
        name: "网络效应",
        description: "用户规模是否形成生态壁垒",
        example: "微信（社交生态）、Facebook（用户网络）",
        maxScore: 6,
        userScore: 0,
      },
      {
        key: "switchingCost",
        name: "转换成本",
        description: "客户更换供应商的代价是否高昂",
        example: "SAP（企业软件迁移成本）、银行账户（数据迁移复杂度）",
        maxScore: 5,
        userScore: 0,
      },
      {
        key: "patentBarrier",
        name: "专利/技术壁垒",
        description: "是否拥有独家技术或知识产权保护",
        example: "辉瑞（药品专利）、ASML（光刻机技术）",
        maxScore: 3,
        userScore: 0,
      },
    ],
  },
  {
    id: "management",
    name: "管理团队",
    items: [
      {
        key: "integrity",
        name: "诚信与能力",
        description: "管理层是否可靠、透明，有无重大失误",
        example: "巴菲特团队（长期稳定）、马斯克（战略执行能力）",
        maxScore: 4,
        userScore: 0,
      },
      {
        key: "strategicVision",
        name: "战略眼光",
        description: "能否制定清晰的长期战略并有效执行",
        example: "亚马逊（长期投资云服务）、宁德时代（新能源布局）",
        maxScore: 3,
        userScore: 0,
      },
      {
        key: "ownershipStructure",
        name: "股权结构",
        description: "管理层是否与股东利益一致",
        example: "茅台（国资控股）、腾讯（创始人持股结构）",
        maxScore: 2,
        userScore: 0,
      },
      {
        key: "capitalAllocation",
        name: "资本配置",
        description: "是否善于合理分配利润",
        example: "伯克希尔（现金储备管理）、苹果（股票回购计划）",
        maxScore: 3,
        userScore: 0,
      },
    ],
  },
  {
    id: "industry",
    name: "行业地位",
    items: [
      {
        key: "marketPosition",
        name: "市场地位",
        description: "是否为行业前三或细分领域领导者",
        example: "茅台（高端白酒市占率70%）、英伟达（AI芯片主导）",
        maxScore: 4,
        userScore: 0,
      },
      {
        key: "growthPotential",
        name: "行业增长潜力",
        description: "行业是否处于成长期或稳定期",
        example: "人工智能（CAGR 25%+）、新能源车（渗透率提升）",
        maxScore: 5,
        userScore: 0,
      },
      {
        key: "competitionLandscape",
        name: "竞争格局",
        description: "行业集中度如何，是否存在恶性竞争或垄断风险",
        example: "光伏行业（CR5 > 60%）、快递行业（价格战）",
        maxScore: 4,
        userScore: 0,
      },
      {
        key: "policyEnvironment",
        name: "政策环境",
        description: "是否受政策支持或限制",
        example: "芯片（国家补贴）、教培（双减限制）",
        maxScore: 2,
        userScore: 0,
      },
    ],
  },
  {
    id: "businessModel",
    name: "商业模式",
    items: [
      {
        key: "profitModel",
        name: "盈利模式",
        description: "收入可持续性（订阅制/佣金制/买断制）",
        example: "微软（软件订阅）、贝壳（交易佣金）",
        maxScore: 7,
        userScore: 0,
      },
      {
        key: "scalability",
        name: "可扩展性",
        description: "业务能否低成本扩张，边际成本是否递减",
        example: "腾讯（数字产品复制零成本）、星巴克（标准化门店）",
        maxScore: 6,
        userScore: 0,
      },
      {
        key: "cashFlow",
        name: "现金流结构",
        description: "是否依赖高杠杆或资本支出",
        example: "茅台（现金流>利润）、房地产（高杠杆模式）",
        maxScore: 7,
        userScore: 0,
      },
    ],
  },
  {
    id: "governance",
    name: "公司治理",
    items: [
      {
        key: "boardIndependence",
        name: "董事会独立性",
        description: "是否存在大股东或管理层过度控制的风险",
        example: "阿里（合伙人制度）、国企（党委参与治理）",
        maxScore: 3,
        userScore: 0,
      },
      {
        key: "informationDisclosure",
        name: "信息披露",
        description: "财务经营信息披露是否公开、准确，及时",
        example: "美的集团（报告详实）、瑞幸咖啡（历史造假）",
        maxScore: 2,
        userScore: 0,
      },
      {
        key: "legalRisk",
        name: "法律风险",
        description: "是否有历史污点，近年有无重大处罚记录",
        example: "滴滴（数据安全审查）、强生（产品诉讼）",
        maxScore: 2,
        userScore: 0,
      },
    ],
  },
  {
    id: "product",
    name: "产品需求",
    items: [
      {
        key: "demandStability",
        name: "需求稳定性",
        description: "产品或服务是否为必需品或高频消费",
        example: "海天味业（必需消费）、LV（奢侈品）",
        maxScore: 3,
        userScore: 0,
      },
      {
        key: "userStickiness",
        name: "用户粘性",
        description: "客户是否持续复购",
        example: "Costco（会员续费率90%+）、Netflix（订阅留存率）",
        maxScore: 3,
        userScore: 0,
      },
      {
        key: "innovationCapability",
        name: "创新能力",
        description: "是否持续推出新产品或迭代服务",
        example: "华为（研发费15%）、药明康德（每年新药申报）",
        maxScore: 3,
        userScore: 0,
      },
    ],
  },
  {
    id: "culture",
    name: "企业文化",
    items: [
      {
        key: "longTermOrientation",
        name: "长期导向",
        description: "是否重视研发、员工培养而非短期利润",
        example: "谷歌（20%自由创新时间）、京东方（持续面板研发）",
        maxScore: 2,
        userScore: 0,
      },
      {
        key: "customerFocus",
        name: "客户至上",
        description: "是否以客户需求为核心",
        example: "海底捞（服务评分4.8+）、苹果（净推荐值62）",
        maxScore: 2,
        userScore: 0,
      },
      {
        key: "employeeSatisfaction",
        name: "员工满意度",
        description: "是否吸引并留住优秀人才",
        example: "字节跳动（高薪酬但高压）、星巴克（员工持股计划）",
        maxScore: 2,
        userScore: 0,
      },
    ],
  },
  {
    id: "adaptability",
    name: "外部适应性",
    items: [
      {
        key: "cyclicalResilience",
        name: "抗周期能力",
        description: "营收和利润是否容易受到经济周期影响",
        example: "海螺水泥（基建周期）、伊利股份（弱周期）",
        maxScore: 2,
        userScore: 0,
      },
      {
        key: "internationalRisk",
        name: "国际风险",
        description: "是否受汇率、地缘政治或贸易摩擦影响",
        example: "富士康（出口依赖）、中芯国际（设备进口限制）",
        maxScore: 2,
        userScore: 0,
      },
      {
        key: "disruptionRisk",
        name: "技术颠覆风险",
        description: "业务是否容易受到行业技术迭代的影响",
        example: "如传统媒体受互联网冲击",
        maxScore: 2,
        userScore: 0,
      },
    ],
  },
];

// 验证外部数据与默认数据的匹配性
const validateExternalData = (externalData: ExternalScoreData) => {
  const warnings: string[] = [];

  // 检查是否有多余的类别
  const externalCategoryIds = Object.keys(externalData);
  const defaultCategoryIds = defaultEvaluationData.map((c) => c.id);

  externalCategoryIds.forEach((catId) => {
    if (!defaultCategoryIds.includes(catId)) {
      warnings.push(`Extra category in external data: ${catId}`);
    }
  });

  // 检查是否有多余的评估项
  externalCategoryIds.forEach((catId) => {
    const category = defaultEvaluationData.find((c) => c.id === catId);
    if (category) {
      const externalItemKeys = Object.keys(externalData[catId]);
      const defaultItemKeys = category.items.map((i) => i.key);

      externalItemKeys.forEach((itemKey) => {
        if (!defaultItemKeys.includes(itemKey)) {
          warnings.push(
            `Extra evaluation item in category ${category.name}: ${itemKey}`,
          );
        }
      });
    }
  });

  return warnings;
};

// 初始化数据并应用外部得分
const evaluationData = ref<EvaluationCategory[]>([]);
const validationWarnings = ref<string[]>([]);

const initializeData = () => {
  // 深拷贝默认数据
  const data = JSON.parse(JSON.stringify(defaultEvaluationData));

  // 如果有外部数据，应用得分
  if (props.scoreData) {
    // 验证数据
    validationWarnings.value = validateExternalData(props.scoreData);

    // 应用外部得分
    Object.keys(props.scoreData).forEach((categoryId) => {
      const category = data.find(
        (c: EvaluationCategory) => c.id === categoryId,
      );
      if (category) {
        const categoryScores = props.scoreData![categoryId];
        Object.keys(categoryScores).forEach((itemKey) => {
          const item = category.items.find(
            (i: EvaluationItem) => i.key === itemKey,
          );
          if (item) {
            const score = categoryScores[itemKey];
            // 确保分数在合理范围内
            item.userScore = Math.max(0, Math.min(score, item.maxScore));
          }
        });
      }
    });
  } else {
    validationWarnings.value = [];
  }

  evaluationData.value = data;
};

// 监听外部数据变化
watch(
  () => props.scoreData,
  () => {
    initializeData();
  },
  { deep: true },
);

// 组件挂载时初始化
onMounted(() => {
  initializeData();
});

// 计算单个类别的得分
const getCategoryScore = (category: EvaluationCategory) => {
  return category.items.reduce((sum, item) => sum + item.userScore, 0);
};

// 计算单个类别的满分
const getCategoryMaxScore = (category: EvaluationCategory) => {
  return category.items.reduce((sum, item) => sum + item.maxScore, 0);
};

// 计算总分
const totalScore = computed(() => {
  return evaluationData.value.reduce((sum, category) => {
    return (
      sum +
      category.items.reduce((itemSum, item) => itemSum + item.userScore, 0)
    );
  }, 0);
});

// 计算满分
const totalMaxScore = computed(() => {
  return evaluationData.value.reduce((sum, category) => {
    return (
      sum + category.items.reduce((itemSum, item) => itemSum + item.maxScore, 0)
    );
  }, 0);
});

// 处理分数变化
const handleScoreChange = () => {
  // 可以在这里添加分数变化后的处理逻辑
  console.log("分数已更新，总分:", totalScore.value);
  updateRadarChart();
};

// 雷达图相关
const radarChartRef = ref<HTMLElement | null>(null);
let radarChart: echarts.ECharts | null = null;

// 计算雷达图数据
const radarData = computed(() => {
  return evaluationData.value.map((category) => {
    const score = getCategoryScore(category);
    const max = getCategoryMaxScore(category);
    return {
      name: category.name,
      value: parseFloat(((score / max) * 100).toFixed(1)),
      score,
      max,
    };
  });
});

// 初始化雷达图
const initRadarChart = () => {
  if (!radarChartRef.value) return;

  radarChart = echarts.init(radarChartRef.value);
  updateRadarChart();

  // 监听窗口大小变化
  window.addEventListener("resize", () => {
    radarChart?.resize();
  });
};

// 更新雷达图
const updateRadarChart = () => {
  if (!radarChart) return;

  const categories = radarData.value.map((item) => item.name);
  const values = radarData.value.map((item) => item.value);

  const option = {
    tooltip: {
      trigger: "item",
      formatter: (params: any) => {
        const dataIndex = params.dataIndex;
        const item = radarData.value[dataIndex];
        return `${item.name}: ${item.score}/${item.max}`;
      },
    },
    radar: {
      indicator: categories.map((name) => ({ name, max: 100 })),
      center: ["50%", "50%"],
      radius: "75%",
      shape: "polygon",
      splitNumber: 5,
      name: {
        textStyle: {
          color: "#303133",
          fontSize: 15,
          fontWeight: "bold",
        },
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: [
            "rgba(66, 165, 245, 0.05)",
            "rgba(66, 165, 245, 0.1)",
            "rgba(66, 165, 245, 0.15)",
            "rgba(66, 165, 245, 0.2)",
            "rgba(66, 165, 245, 0.25)",
          ],
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "rgba(66, 165, 245, 0.3)",
          width: 1,
        },
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "rgba(66, 165, 245, 0.3)",
          width: 1,
        },
      },
    },
    series: [
      {
        name: "价值评估",
        type: "radar",
        data: [
          {
            value: values,
            name: "评估得分",
            areaStyle: {
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: "rgba(66, 165, 245, 0.5)",
                  },
                  {
                    offset: 1,
                    color: "rgba(66, 165, 245, 0.15)",
                  },
                ],
              },
              opacity: 0.6,
            },
            lineStyle: {
              color: "#42a5f5",
              width: 3,
              shadowColor: "rgba(66, 165, 245, 0.5)",
              shadowBlur: 10,
            },
            itemStyle: {
              color: "#42a5f5",
              borderColor: "#fff",
              borderWidth: 2,
              shadowColor: "rgba(66, 165, 245, 0.5)",
              shadowBlur: 10,
            },
            symbol: "circle",
            symbolSize: 8,
          },
        ],
      },
    ],
  };

  radarChart.setOption(option);
};

// 组件挂载后初始化雷达图
onMounted(() => {
  nextTick(() => {
    initRadarChart();
  });
});

// 监听分数变化更新雷达图
watch(
  radarData,
  () => {
    updateRadarChart();
  },
  { deep: true },
);
</script>

<style scoped lang="scss">
.value-evaluation {
  padding: 10px;

  .validation-warnings {
    margin-bottom: 20px;
  }

  .radar-chart-container {
    width: 100%;
    height: 400px;
    margin-bottom: 20px;
    background: #fff;
    border-radius: 4px;

    .radar-chart {
      width: 100%;
      height: 100%;
    }
  }

  .evaluation-table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: #f5f7fa;
      border: 1px solid #dcdfe6;
      padding: 8px;
      text-align: center;
      font-weight: bold;
      color: #303133;
    }

    td {
      border: 1px solid #dcdfe6;
      padding: 8px;
      text-align: left;
      vertical-align: middle;
    }

    .element-col {
      width: 120px;
      text-align: center;
      white-space: pre-line;
      line-height: 1.6;
    }

    .description-col {
      min-width: 180px;
    }

    .example-col {
      min-width: 180px;
    }

    .score-col {
      width: 60px;
      text-align: center;
    }

    .input-col {
      width: 100px;
      text-align: center;

      :deep(.el-input-number) {
        width: 80px;
      }
    }

    .category-separator {
      font-weight: bold;

      td {
        text-align: center;
      }

      td:first-child {
        text-align: left;
        font-weight: bold;
      }
    }

    .total-separator {
      font-weight: bold;

      .total-label {
        text-align: left;
        font-weight: bold;
      }

      td {
        text-align: center;
      }

      td:first-child {
        text-align: left;
      }
    }
  }
}
</style>
