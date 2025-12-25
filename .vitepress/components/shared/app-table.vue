<script setup lang="ts">
import { computed, ref, onMounted, watch } from "vue";
import MarkdownIt from "markdown-it";
import * as echarts from "echarts";

// 定义表格列的接口
export interface TableColumn {
  key: string;
  title: string;
  formatter?: (value: any, row?: any) => string | number;
  // 单元格合并配置
  merge?: {
    // 是否启用该列的单元格合并
    enable?: boolean;
    // 自定义合并规则函数，返回 {rowspan, colspan} 或 null（不合并）
    custom?: (
      row: any,
      column: TableColumn,
      rowIndex: number,
      columnIndex: number
    ) => { rowspan: number; colspan: number } | null;
  };
  // 表头单元格合并配置
  _headerMerge?: {
    rowspan?: number;
    colspan?: number;
  };
}

// 数据行自定义合并
// data: [
//   {
//     name: '产品A',
//     _cellMerge: {
//       name: { rowspan: 2, colspan: 1 } // 合并两行
//     }
//   }
// ]

// 定义合并单元格的接口
interface MergeCell {
  rowspan: number;
  colspan: number;
}

// 定义组件的属性
const props = withDefaults(
  defineProps<{
    caption: string;
    data: any[];
    columns: TableColumn[];
    emptyText?: string;
    groupKey?: string;
    defaultSelectedKey?: string;
    description?: string;
  }>(),
  {
    caption: "",
    data: () => [],
    columns: () => [],
    emptyText: "暂无数据",
  }
);

const md = MarkdownIt({
  html: true,
});

const mdText =
  typeof props.description === "string" ? md.render(props.description) : "";

const showChart = computed(() => {
  if (props.data.length === 0) {
    return false;
  }
  return true;
});

// 图表相关逻辑
const chartRef = ref<HTMLElement>();
const chartInstance = ref<echarts.ECharts>();
const selectedColumns = ref<string[]>(
  showChart.value && props.defaultSelectedKey
    ? [props.defaultSelectedKey]
    : [props.columns[1].key]
);

// 控制说明弹窗的显示状态
const showDescription = ref(false);

// 初始化图表
onMounted(() => {
  if (chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value);
    updateChart();
  }
});

// 监听数据变化更新图表
watch(
  () => props.data,
  () => {
    updateChart();
  },
  { deep: true }
);

function groupBy<T extends Record<string, any>, K extends keyof T>(
  array: T[],
  key: K
): T[][] {
  const resultMap = new Map<T[K], T[]>();

  for (const item of array) {
    const keyValue = item[key];

    if (!resultMap.has(keyValue)) {
      resultMap.set(keyValue, []);
    }

    resultMap.get(keyValue)!.push(item);
  }

  return Array.from(resultMap.values());
}

const group = computed(() => {
  return props.groupKey ? groupBy(props.data, props.groupKey) : [props.data];
});

const years = computed(() => {
  return Array.from(
    new Set(
      props.data.map((item) => item.year).filter((year) => /\d{4}/.test(year))
    )
  );
});

// 更新图表数据
function updateChart() {
  if (!showChart.value) return;

  if (!chartInstance.value && chartRef.value) {
    chartInstance.value = echarts.init(chartRef.value);
  }

  if (!chartInstance.value) return;

  const series: echarts.SeriesOption[] = [];
  let barCount = 0;

  // 添加选中的列数据
  selectedColumns.value.forEach((colKey) => {
    const column = props.columns.find((c) => c.key === colKey);
    if (!column) return;

    group.value.forEach((arr, i) => {
      const values = years.value.map((year) => {
        const target = arr.find((v) => v.year === year);
        if (target) {
          const val = target[colKey];
          if (column.formatter) {
            return column.formatter(val);
          }
        }
        return "-";
      });

      const isPercentage =
        /率|\/|比重/.test(column.title) ||
        values.some((v) => v?.toString().includes("%"));
      const name = props.groupKey
        ? `${column.title}-${arr[0][props.groupKey]}`
        : column.title;
      const data = values.map((v) => {
        if (v === "-") return null;
        return Number(v.toString().replace(/%/, ""));
      });

      if (isPercentage) {
        // 右侧y轴(百分比) - 折线图
        series.push({
          name,
          type: "line",
          yAxisIndex: 1,
          data,
          showSymbol: true,
          symbolSize: (val) => (val !== null ? 6 : 0),
          symbol: "circle",
          lineStyle: {
            width: 2,
          },
          label: {
            show: true,
            position: "top",
            formatter: (params: any) => {
              return params.value !== null
                ? params.value > 10
                  ? `${params.value.toFixed(0)}%`
                  : `${params.value}%`
                : "";
            },
          },
        });
      } else {
        barCount += 1;
        // 左侧y轴(数值) - 柱状图
        series.push({
          name,
          type: "bar",
          yAxisIndex: 0,
          data,
          showBackground: false,
          label: {
            show: true,
            formatter: (params: any) => {
              return params.value !== null
                ? params.value > 10
                  ? params.value.toFixed(0)
                  : params.value
                : "";
            },
            position: "top",
          },
        });
      }
    });
  });

  let barWidthPercent = 85;
  if (barCount > 0) {
    barWidthPercent = (0.85 / barCount) * 100;
  }
  if (barWidthPercent > 40) {
    barWidthPercent = 40;
  }

  const option: echarts.EChartsOption = {
    tooltip: {
      trigger: "axis",
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "15%", // 增加底部空间
      containLabel: true,
    },
    legend: {
      data: selectedColumns.value.reduce((pre: string[], colKey) => {
        const title =
          props.columns.find((c) => c.key === colKey)?.title || colKey;
        if (props.groupKey) {
          return pre.concat(
            group.value.map((v) => `${title}-${v[0][props.groupKey!]}`)
          );
        }
        pre.push(title);
        return pre;
      }, []),
      selected: Object.fromEntries(
        selectedColumns.value.map((colKey) => [colKey, true])
      ),
      top: "bottom", // 将图例放在底部
      padding: [10, 0, 0, 0], // 增加顶部内边距
    },
    xAxis: {
      type: "category",
      data: years.value,
      axisPointer: {
        type: "shadow",
      },
      axisLine: {
        show: true,
        lineStyle: {
          width: 1,
        },
      },
      axisTick: {
        show: true,
        alignWithLabel: true,
      },
      axisLabel: {
        interval: 0,
        rotate: years.value.length > 11 ? 30 : 0,
      },
    },
    yAxis: [
      {
        type: "value",
        name: "",
        position: "left",
        axisLine: {
          show: true,
          lineStyle: {
            width: 1,
          },
        },
        axisTick: {
          show: true,
        },
        splitLine: {
          lineStyle: {
            type: "dashed",
          },
        },
      },
      {
        type: "value",
        name: "",
        position: "right",
        axisLabel: {
          formatter: "{value}%",
        },
        splitLine: {
          show: false,
        },
      },
    ],
    series: series.map((s) => ({
      ...s,
      barWidth: `${barWidthPercent}%`,
      barGap: "10%",
      barCategoryGap: "20%",
    })),
  };

  chartInstance.value?.clear();
  chartInstance.value?.setOption(option, true);
}

// 处理列点击事件
function handleColumnClick(columnKey: string) {
  const index = selectedColumns.value.indexOf(columnKey);
  if (index === -1) {
    selectedColumns.value.push(columnKey);
  } else {
    selectedColumns.value.splice(index, 1);
  }
  updateChart();
}

// 判断数据是否为空
const isEmpty = computed(() => !props.data || props.data.length === 0);

// 计算单元格合并属性
const getMergeCellAttrs = (
  row: any,
  column: TableColumn,
  rowIndex: number,
  columnIndex: number
): MergeCell | null => {
  // 1. 首先检查行数据中是否有针对该列的合并单元格配置（最高优先级）
  if (row._cellMerge && row._cellMerge[column.key]) {
    return row._cellMerge[column.key];
  }

  // 2. 如果列没有配置合并或者未启用合并，返回null
  if (!column.merge || !column.merge.enable) {
    return null;
  }

  // 3. 如果有自定义合并规则，使用自定义规则
  if (column.merge.custom) {
    return column.merge.custom(row, column, rowIndex, columnIndex);
  }

  // 4. 默认合并规则：相同值的连续单元格合并
  const currentValue = row[column.key];

  // 如果是第一行或者当前值与上一行不同
  if (rowIndex === 0 || props.data[rowIndex - 1][column.key] !== currentValue) {
    // 计算当前值连续出现的次数
    let count = 1;
    for (let i = rowIndex + 1; i < props.data.length; i++) {
      if (props.data[i][column.key] === currentValue) {
        count++;
      } else {
        break;
      }
    }

    // 如果有连续相同的值，设置rowspan
    if (count > 1) {
      return { rowspan: count, colspan: 1 };
    }
  }
  // 如果当前值与上一行相同，则该单元格不显示（rowspan=0）
  else {
    return { rowspan: 0, colspan: 0 };
  }

  return null;
};

// 判断单元格是否需要渲染
const shouldRenderCell = (
  row: any,
  column: TableColumn,
  rowIndex: number,
  columnIndex: number
): boolean => {
  const mergeAttrs = getMergeCellAttrs(row, column, rowIndex, columnIndex);
  // 如果rowspan和colspan都为0，则不渲染该单元格
  return !(mergeAttrs && mergeAttrs.rowspan === 0 && mergeAttrs.colspan === 0);
};

// 获取单元格的值
const getCellValue = (row: any, column: TableColumn) => {
  const value = row[column.key];

  // 如果是统计行且不是年份列，直接返回值，不应用formatter
  if (row._isStatRow && column.key !== "year") {
    return isNaN(value) ? "-" : value.toFixed(2) + "%";
  }

  if (column.formatter) {
    return column.formatter(value, row);
  }
  return value ?? "-";
};

// 处理表格标题，最多显示两行，并且两行字数尽量平衡
const formatColumnTitle = (title: string) => {
  // 如果标题为空或长度小于等于4，直接返回
  if (!title || title.length <= 4) return title;

  // 尝试在标点符号或空格处分割
  const punctuationMatch = title.match(/[,，.。、/:：;；!！?？\s]/);

  if (
    punctuationMatch &&
    punctuationMatch.index &&
    punctuationMatch.index > 1 &&
    punctuationMatch.index < title.length - 2
  ) {
    // 在标点符号处分割，确保两行字数相对平衡
    const splitIndex = punctuationMatch.index + 1;
    const firstLine = title.substring(0, splitIndex);
    0;
    const secondLine = title.substring(splitIndex);

    // 如果分割后两行字数差距太大，则使用中点分割
    if (Math.abs(firstLine.length - secondLine.length) > title.length / 3) {
      const midPoint = Math.ceil(title.length / 2);
      return `<span style="white-space: nowrap;">${title.substring(
        0,
        midPoint
      )}</span><br><span style="white-space: nowrap;">${title.substring(
        midPoint
      )}</span>`;
    }

    return `<span style="white-space: nowrap;">${firstLine}</span><br><span style="white-space: nowrap;">${secondLine}</span>`;
  }

  // 如果没有合适的标点符号，则在中点附近寻找合适的汉字分割点
  const midPoint = Math.ceil(title.length / 2);

  // 尝试在中文词语边界处分割（避免在词语中间断开）
  // 这里简单处理，实际中文分词可能需要更复杂的算法
  let adjustedMidPoint = midPoint;

  // 如果标题长度大于6，尝试在中点附近找到更合适的分割点
  if (title.length > 6) {
    // 在中点前后2个字符范围内寻找更合适的分割点
    for (let i = 1; i <= 2; i++) {
      if (midPoint - i >= 1) {
        adjustedMidPoint = midPoint - i;
        break;
      }
      if (midPoint + i <= title.length - 1) {
        adjustedMidPoint = midPoint + i;
        break;
      }
    }
  }

  return `<span style="white-space: nowrap;">${title.substring(
    0,
    adjustedMidPoint
  )}</span><br><span style="white-space: nowrap;">${title.substring(
    adjustedMidPoint
  )}</span>`;
};
</script>

<template>
  <div class="chart-container" ref="chartRef" v-if="showChart"></div>
  <table>
    <caption v-if="caption || description">
      <div class="caption-wrapper">
        <span>{{ caption }}</span>
        <span
          v-if="description"
          class="help-icon"
          @click="showDescription = true"
          title="查看说明"
        >
          ?
        </span>
      </div>
    </caption>
    <thead>
      <tr>
        <template v-for="(column, columnIndex) in columns" :key="column.key">
          <th
            v-if="!column._headerMerge || column._headerMerge.rowspan !== 0"
            :rowspan="column._headerMerge?.rowspan || 1"
            :colspan="column._headerMerge?.colspan || 1"
            @click="handleColumnClick(column.key)"
            :class="{ 'selected-column': selectedColumns.includes(column.key) }"
          >
            <span v-html="formatColumnTitle(column.title)"></span>
          </th>
        </template>
      </tr>
    </thead>
    <tbody>
      <template v-if="!isEmpty">
        <tr v-for="(row, rowIndex) in data" :key="rowIndex">
          <template v-for="(column, columnIndex) in columns" :key="column.key">
            <td
              v-if="shouldRenderCell(row, column, rowIndex, columnIndex)"
              :rowspan="
                getMergeCellAttrs(row, column, rowIndex, columnIndex)
                  ?.rowspan || 1
              "
              :colspan="
                getMergeCellAttrs(row, column, rowIndex, columnIndex)
                  ?.colspan || 1
              "
            >
              {{ getCellValue(row, column) }}
            </td>
          </template>
        </tr>
      </template>
      <tr v-else>
        <td :colspan="columns.length">
          {{ emptyText }}
        </td>
      </tr>
    </tbody>
  </table>

  <!-- 说明弹窗 -->
  <div
    v-if="showDescription"
    class="description-overlay"
    @click="showDescription = false"
  >
    <div class="description-modal" @click.stop>
      <div class="description-header">
        <h3>分析方法</h3>
        <button class="close-btn" @click="showDescription = false">×</button>
      </div>
      <div class="description-content vp-doc" v-html="mdText"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.chart-container {
  width: 100%;
  height: 300px;
  margin-bottom: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  margin-bottom: 20px;
}

caption {
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 8px;
  text-align: center;
  caption-side: top;
}

.caption-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.help-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background-color: #e6f7ff;
  color: #1890ff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: #bae7ff;
    transform: scale(1.1);
  }
}

th {
  font-weight: 600;
  padding: 2px 4px;
  line-height: 1.2;
  text-align: center;
}

td {
  padding: 2px 4px;
  line-height: 32px;
  white-space: nowrap;
  text-align: center;
}

// 根据表格大小调整样式
:deep(.core-profit-table--small) {
  th,
  td {
    height: 28px;
    line-height: 28px;
    font-size: 13px;
  }
}

:deep(.core-profit-table--large) {
  th,
  td {
    height: 44px;
    line-height: 44px;
    font-size: 15px;
  }
}

// 确保表格内容垂直居中
th span,
td span {
  display: inline-block;
  vertical-align: middle;
  line-height: normal;
}

// 选中列的样式
th.selected-column {
  background-color: #f0f7ff;
  position: relative;

  &::after {
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background-color: #1890ff;
  }
}

// 说明弹窗样式
.description-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  z-index: 1000;
  padding-top: 10vh;
}

.description-modal {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 1080px;
  max-height: calc(85vh);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin-top: 0;
  animation: slideDown 0.2s ease-out;
}

.description-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e8e8e8;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  color: #8c8c8c;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f5f5f5;
    color: #262626;
  }
}

.description-content {
  padding: 0 20px;
  overflow-y: auto;
  // 确保内容区域有足够的内边距
  padding: 20px;
}

// 弹窗滑入动画
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
