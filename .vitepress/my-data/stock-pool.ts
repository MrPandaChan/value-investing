import { ref } from "vue";

export enum Industry {
  INTERNET = "互联网",
  AUTOMOTIVE_AND_PARTS = "汽车与零配件",
  TRADITIONAL_CHINESE_MEDICINE = "中药",
  MEDIA = "传媒",
  SEAPORTS_AND_SERVICES = "海港与服务",
  PAPER_AND_PACKAGING = "造纸与包装",
  BANKING = "银行",
  HOME_APPLIANCES = "家电",
  TELECOMMUNICATION_SERVICES = "通讯服务",
  ELECTRIC_POWER = "电力",
  PETROLEUM_AND_PETROCHEMICALS = "石油石化",
  NON_FERROUS_METALS = "有色金属",
  PROPERTY_MANAGEMENT = "物业管理",
  TEXTILES_AND_APPAREL = "纺织服装",
  POP_TOYS = "潮玩",
  BAIJIU = "白酒",
  DAIRY_PRODUCTS = "乳制品",
  COAL = "煤炭",
  INSURANCE = "保险",
  ENTERPRISE_SERVICES = "企业服务",
  SHIPPING = "航运",
  MACHINERY = "机械",
  FINANCIAL = "金融",
  BEVERAGE = "茶饮",
  MATERIALS = "材料",
  SECURITY = "安防",
  ETF = "ETF",
}

/**
 * 组合共同依赖标签，用于识别"正常事故"中的隐藏耦合。
 * 不是行业分类，而是跨行业的共同依赖维度。
 *
 * 通过对每个公司进行风险画像分析来确定权重应该多大，避免太过于拍脑袋
 */
export enum TagKey {
  /** 收入主要来自中国境内需求 */
  DOMESTIC = "内需",
  /** 收入来自海外市场/出口 */
  EXPORT = "外需/出口",
  /** 类债属性，盈利与利率强相关（银行/保险/运营商/公用事业/地产） */
  RATE = "利率敏感",
  /** 盈利与商品/周期价格强相关（油/煤/金铜/化工/运价） */
  COMMODITY = "商品价格",
  /** 盈利对人民币汇率敏感（美元收入/出口型） */
  FX = "汇率",
  /** 受政策、牌照、监管、补贴强影响 */
  POLICY = "政策/监管",
  /** 流动性较差（港股小盘/B股） */
  LOW_LIQUIDITY = "低流动性",
  /** 收入/盈利对国内消费周期弹性（可选消费高、必选消费中、公用事业低） */
  CONSUMER_SENSITIVITY = "消费敏感度",
}

/** 单个标签及暴露程度，weight 取值 0~1，缺省视为 1 */
export interface StockTag {
  tag: TagKey;
  weight?: number;
}

interface PlanEntry {
  value: number;
  quantity: number; // 计划买入股数
}

interface BasePlan {}

export enum PlanType {
  EMPTY, // 没有计划
  PRICE, // 按价格
  DIVIDEND, // 按股息率
  PE, // PE_TTM
}

interface PricePlan extends BasePlan {
  type: PlanType.PRICE;
  price: PlanEntry[];
}

interface DividendPlan extends BasePlan {
  type: PlanType.DIVIDEND;
  dividend: PlanEntry[];
}

interface PEPlan extends BasePlan {
  type: PlanType.PE;
  pe: PlanEntry[];
}

export interface EntryPrice {
  type: PlanType;
  value: number;
}

export type PlanItem = PricePlan | DividendPlan | PEPlan;

export interface StockItem {
  code: string;
  sharesHeld?: number; // 持有股数
  url?: string;
  industry: Industry;
  remark?: string;
  /** 综合素质评分 0-5 */
  qualityScore: number;
  /**
   * 年分红调整系数，与年分红相乘得到调整后年分红，
   * 调整后年分红用于股息率反推股价
   */
  dividendAdjust?: number;
  /** 一年分红次数，设置后仅展示和计算最新的 n 条分红数据 */
  dividendPerYear?: number;
  maxPositionRatio: number;
  plan: PlanItem; // 买入计划
  exit: PlanItem; // 退出计划，数据结构与 plan 一致
  strikePrice: EntryPrice; // 击球点
  /** 共同依赖标签（用于组合集中度统计，weight 0~1） */
  tags?: StockTag[];
}

/**
 * 买入：至少 8% 预期回报率开始买入
 * 退出：大部分以股息率小于 “无风险收益率 × 3” 作为开始退出位置
 */
const stocks: StockItem[] = [
  {
    // 腾讯控股
    /**
     * 9.5% - 467
     * 10% - 443
     * 10.5% - 422
     * 11% - 403
     * 11.5% - 386
     * 12% - 370
     */
    code: "00700",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.75 },
      { tag: TagKey.EXPORT, weight: 0.25 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.6 },
    ],
    industry: Industry.INTERNET,
    qualityScore: 4.5,
    sharesHeld: 400,
    dividendAdjust: 0.8,
    url: "/value-investing/industry/传媒/互联网平台/腾讯控股/",
    remark:
      "**稳定增长型**，景气度→，互联网公用事业，AI资本开支大，护城河深厚，中性情况下预计1%dy+10%eps=11%cagr，近期业绩可能承压，PE15左右合理",
    maxPositionRatio: 0.2,
    plan: {
      type: PlanType.PRICE,
      price: [
        // { value: 403, quantity: 200 },
        // { value: 386, quantity: 200 },
        // { value: 370, quantity: 200 },
        // 直接取中间的价格
        { value: 394.6, quantity: 200 },
        { value: 378, quantity: 200 },
      ],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 20, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 15,
    },
  },
  {
    // 福耀玻璃
    code: "600660",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.4 },
    ],
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 4,
    dividendPerYear: 2,
    sharesHeld: 1200,
    url: "/value-investing/industry/汽车/汽车玻璃/福耀玻璃/",
    remark:
      "**稳定增长型**，景气度↘，全球汽车下行但市占率+ASP提升对冲，中性情况下预计4%dy+5%~8%eps=9%~12%cagr，PE15左右合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.PRICE,
      price: [
        { value: 47.5, quantity: 300 },
        { value: 45, quantity: 400 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.03, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 12,
    },
  },
  {
    // 云南白药
    code: "000538",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.7 },
    ],
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    qualityScore: 3.5,
    sharesHeld: 1000,
    url: "/value-investing/industry/医药生物/中药/云南白药/",
    remark:
      "**稳定增长型→缓慢增长型**，景气度→，各板块市占率见顶，中性情况下预计5%dy+3%~5%eps=8%~10%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      // price: [{ value: 46.8, quantity: 400 }], // 已接
      dividend: [{ value: 0.06, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 东阿阿胶
    code: "000423",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.7 },
    ],
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    qualityScore: 3.5,
    sharesHeld: 900,
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↘，警惕压货和无序提价，驴皮紧张，消费萎靡，中性情况下预计5%dy+3%~5%eps=8%~10%cagr，股息率5%以上合理",
    url: "/value-investing/industry/医药生物/中药/东阿阿胶/",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      // price: [{ value: 43.8, quantity: 400 }], // 已买
      dividend: [
        { value: 0.065, quantity: 100 },
        { value: 0.07, quantity: 100 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 羚锐制药
    code: "600285",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.6 },
    ],
    industry: Industry.TRADITIONAL_CHINESE_MEDICINE,
    qualityScore: 3,
    sharesHeld: 900,
    dividendPerYear: 1,
    remark:
      "**稳定增长型→缓慢增长型**，景气度→，贴膏板块见顶，竞争压力大，第二曲线待观察，销售费用率高，中性情况下预计5%dy+3%~5%eps=8%~10%cagr，PE13左右合理（护城河狭窄）",
    url: "/value-investing/industry/医药生物/中药/羚锐制药/",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 18.2, quantity: 700 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 分众传媒
    code: "002027",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.8 },
    ],
    industry: Industry.MEDIA,
    qualityScore: 3.5,
    dividendPerYear: 3,
    sharesHeld: 4000,
    url: "/value-investing/industry/传媒/广告营销/分众传媒/",
    remark:
      "**周期型**，景气度↘，经济萎靡，新潮收购需跟踪，中性情况下预计7%dy+1%~2%eps=8%~9%cagr，适合CAPE估值，股息率7%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        // { value: 0.07, quantity: 2200 }, // 已买
        { value: 0.075, quantity: 3000 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.075,
    },
  },
  {
    // 青岛港H
    code: "06198",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.75 },
      { tag: TagKey.EXPORT, weight: 0.25 },
      { tag: TagKey.LOW_LIQUIDITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.SEAPORTS_AND_SERVICES,
    qualityScore: 3.5,
    sharesHeld: 1000,
    url: "/value-investing/industry/交通运输/港口/青岛港/",
    remark:
      "**缓慢增长型**，景气度→，集装箱亮点液散承压，中性情况下预计4.5%dy+2%~4%eps=6.5%~8.5%cagr，股息率4.5%以上合理",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.052, quantity: 2000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 1000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 青岛港A
    code: "601298",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.75 },
      { tag: TagKey.EXPORT, weight: 0.25 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.SEAPORTS_AND_SERVICES,
    qualityScore: 3.5,
    sharesHeld: 4000,
    url: "/value-investing/industry/交通运输/港口/青岛港/",
    remark:
      "**缓慢增长型**，景气度→，集装箱亮点液散承压，中性情况下预计4%dy+2%~4%eps=6%~8%cagr，股息率4%以上合理",
    dividendPerYear: 2,
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        { value: 0.047, quantity: 1500 },
        {
          value: 0.05,
          quantity: 3000,
        },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 永新股份
    code: "002014",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.5 },
    ],
    industry: Industry.PAPER_AND_PACKAGING,
    qualityScore: 3,
    dividendPerYear: 2,
    sharesHeld: 1000,
    url: "/value-investing/industry/轻工制造/包装印刷/永新股份/",
    remark:
      "**稳定增长型**，景气度↘，油价高位压制毛利率，薄膜第二曲线放量中，中性情况下预计5%dy+4%~6%eps=9%~11%cagr，短期承压（毛利率20.86%十年低位），股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.057, quantity: 1000 }],
      // price: [
      //   { value: 9.7, quantity: 1400 },
      //   { value: 9.2, quantity: 1600 },
      // ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 招商银行
    code: "600036",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.4 },
    ],
    industry: Industry.BANKING,
    qualityScore: 4,
    sharesHeld: 1600,
    url: "/value-investing/industry/银行/招商银行/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型（边缘，有向缓慢增长漂移趋势）**，景气度→，关注净息差和财富管理中收，中性情况下预计5%dy+1%~3%eps=6%~8%cagr，股息率5%以上合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.PRICE,
      price: [
        // { value: 36.5, quantity: 400 }, // 已买
        // { value: 35.5, quantity: 200 }, // 已买
        { value: 34.5, quantity: 400 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 工商银行
    code: "601398",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.3 },
    ],
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark:
      "**缓慢增长型**，景气度→，关注净息差和资产质量，中性情况下预计5.5%dy+0%~2%eps=5.5%~7.5%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 中国银行
    code: "601988",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.3 },
    ],
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark:
      "**缓慢增长型**，景气度→，关注净息差和资产质量，中性情况下预计5.5%dy+0%~2%eps=5.5%~7.5%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 农业银行
    code: "601288",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.3 },
    ],
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark:
      "**缓慢增长型**，景气度→，关注净息差和资产质量，中性情况下预计5.5%dy+0%~2%eps=5.5%~7.5%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 建设银行
    code: "601939",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.3 },
    ],
    industry: Industry.BANKING,
    qualityScore: 3.5,
    dividendPerYear: 2,
    url: "",
    remark:
      "**缓慢增长型**，景气度→，关注净息差和资产质量，中性情况下预计5.5%dy+0%~2%eps=5.5%~7.5%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 兴业银行
    code: "601166",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.35 },
    ],
    industry: Industry.BANKING,
    qualityScore: 3,
    dividendPerYear: 2,
    url: "",
    remark:
      "**缓慢增长型**，景气度→，关注净息差和资产质量，中性情况下预计7%dy+0%~2%eps=7%~9%cagr，股息率7%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.07, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.07,
    },
  },
  {
    // 中创智领A
    code: "601717",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.MACHINERY,
    qualityScore: 2.5,
    url: "/value-investing/industry/机械设备/煤矿机械/中创智领/",
    dividendPerYear: 1,
    remark:
      "**周期型**，景气度↓，煤机周期下行，汽零新能源第二曲线待验证，中性情况下预计8%dy+0%eps=8%cagr，当前承压（扣非-35%），股息率8%以上合理",
    maxPositionRatio: 0.02,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.1, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.06, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 中创智领H
    code: "00564",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.LOW_LIQUIDITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.MACHINERY,
    qualityScore: 2.5,
    url: "/value-investing/industry/机械设备/煤矿机械/中创智领/",
    dividendPerYear: 1,
    remark:
      "**周期型**，景气度↓，煤机周期下行，汽零新能源第二曲线待验证，中性情况下预计8%dy+0%eps=8%cagr，当前承压（扣非-35%），股息率8%以上合理",
    dividendAdjust: 0.8,
    maxPositionRatio: 0.02,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.1, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.06, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 美的集团
    code: "000333",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.6 },
      { tag: TagKey.EXPORT, weight: 0.4 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.8 },
    ],
    industry: Industry.HOME_APPLIANCES,
    qualityScore: 4,
    sharesHeld: 100,
    url: "/value-investing/industry/家用电器/白电/美的集团/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↘，国内空调内销承压，海外+ToB对冲，中性情况下预计5%dy+5%~8%eps=10%~13%cagr，股息率5%以上合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.PRICE,
      price: [
        { value: 71.2, quantity: 300 },
        { value: 67.2, quantity: 500 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 海尔智家
    code: "600690",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.75 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.8 },
    ],
    industry: Industry.HOME_APPLIANCES,
    qualityScore: 3.5,
    sharesHeld: 3600,
    url: "/value-investing/industry/家用电器/白电/海尔智家/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↘，北美关税+国内需求疲软，海外品牌矩阵强，中性情况下预计5%dy+3%~5%eps=8%~10%cagr，股息率5%以上合理",
    maxPositionRatio: 0.08,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 18.5, quantity: 1000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.058,
    },
  },
  {
    // 格力电器
    code: "000651",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.8 },
    ],
    industry: Industry.HOME_APPLIANCES,
    qualityScore: 3,
    sharesHeld: 1200,
    url: "/value-investing/industry/家用电器/白电/格力电器/",
    dividendPerYear: 2,
    remark:
      "**缓慢增长型**，景气度↓，空调份额下滑，高股息防御，中性情况下预计7%dy+0%~2%eps=7%~9%cagr，股息率7%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 36, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.08,
    },
  },
  {
    // 中国移动
    code: "600941",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 4,
    sharesHeld: 700,
    url: "/value-investing/industry/通信/运营商/中国移动/",
    dividendPerYear: 2,
    remark:
      "**缓慢增长型**，景气度↘，ARPU承压，算力新业务提供期权，中性情况下预计5.9%dy+0%~3%eps=5.9%~8.9%cagr，股息率5.5%以上合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        // { value: 0.055, quantity: 100 }, // 已买
        { value: 0.058, quantity: 200 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 中国电信
    code: "601728",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3.5,
    url: "/value-investing/industry/通信/运营商/中国电信/",
    dividendPerYear: 2,
    remark:
      "**缓慢增长型**，景气度↘，类债属性几乎不增长，智能业务待放量，中性情况下预计6%dy+1%eps=7%cagr，当前承压（净利转负），股息率6%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.055, quantity: 2000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 1000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.058,
    },
  },
  {
    // 中国电信H
    code: "00728",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3.5,
    sharesHeld: 2000,
    url: "/value-investing/industry/通信/运营商/中国电信/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    remark:
      "**缓慢增长型**，景气度↘，类债属性几乎不增长，智能业务待放量，中性情况下预计6%dy+1%eps=7%cagr，当前承压（净利转负），股息率6%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.062, quantity: 4000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 2000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.058,
    },
  },
  {
    // 中国铁塔
    code: "00788",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3,
    sharesHeld: 2500,
    url: "/value-investing/industry/通信/运营商/中国铁塔/",
    dividendPerYear: 2,
    dividendAdjust: 0.8 * 1.3,
    remark:
      "**缓慢增长型**，景气度→，折旧到期利润释放期，中性情况下预计7%dy+1%~2%eps=8%~9%cagr，短期向好（折旧到期），股息率6.5%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.065, quantity: 1000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 500 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.065,
    },
  },
  {
    // 长江电力
    code: "600900",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0 },
    ],
    industry: Industry.ELECTRIC_POWER,
    qualityScore: 4.5,
    sharesHeld: 1200,
    url: "/value-investing/industry/公用事业/电力/长江电力/",
    dividendPerYear: 2,
    remark:
      "**缓慢增长型**，景气度↗，来水改善，电价小幅下行，中性情况下预计4%dy+3%~5%eps=8%~9%cagr，股息率4%以上合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.038, quantity: 1000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.03, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.04,
    },
  },
  {
    // 国投电力
    code: "600886",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0 },
    ],
    industry: Industry.ELECTRIC_POWER,
    qualityScore: 3,
    sharesHeld: 1200,
    url: "/value-investing/industry/公用事业/电力/国投电力/",
    dividendPerYear: 1,
    remark:
      "**稳定增长型**，景气度→，来水恢复，火电受煤价压制，中性情况下预计4%dy+3%~5%eps=8%~9%cagr，股息率4%以上合理",
    maxPositionRatio: 0.08,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 1000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.03, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.04,
    },
  },
  {
    // 中国海油A
    code: "600938",
    tags: [
      { tag: TagKey.COMMODITY, weight: 1 },
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.PETROLEUM_AND_PETROCHEMICALS,
    qualityScore: 4.5,
    url: "/value-investing/industry/石油石化/油气开采/中国海油/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↗，油价高位，产量年增3%~5%，中性情况下预计4%dy+5%~8%eps=9%~12%cagr，短期向好（油价高位），股息率4%以上合理",
    maxPositionRatio: 0.2,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.05, quantity: 1400 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 中国海洋石油H
    code: "00883",
    tags: [
      { tag: TagKey.COMMODITY, weight: 1 },
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.PETROLEUM_AND_PETROCHEMICALS,
    qualityScore: 4.5,
    url: "/value-investing/industry/石油石化/油气开采/中国海油/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    remark:
      "**周期型**，景气度↗，油价高位，产量年增3%~5%，中性情况下预计5.5%dy+5%~8%eps=10.5%~13.5%cagr，短期向好（油价高位），股息率5%以上合理",
    maxPositionRatio: 0.2,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.05, quantity: 1000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.032, quantity: 1000 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 紫金矿业
    code: "601899",
    tags: [
      { tag: TagKey.COMMODITY, weight: 1 },
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.05 },
    ],
    industry: Industry.NON_FERROUS_METALS,
    qualityScore: 4,
    sharesHeld: 500,
    url: "/value-investing/industry/有色金属/铜金/紫金矿业/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↗，金铜价格高位，产量持续扩张，中性情况下预计3%dy+10%~15%eps=13%~18%cagr，短期向好（金铜高位），PE 11倍左右合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 23.5, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.02, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 24.5,
    },
  },
  {
    // 保利物业
    code: "06049",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.POLICY, weight: 0.75 },
      { tag: TagKey.LOW_LIQUIDITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.5 },
    ],
    industry: Industry.PROPERTY_MANAGEMENT,
    qualityScore: 3,
    sharesHeld: 600,
    url: "/value-investing/industry/房地产/物业服务/保利物业/",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    maxPositionRatio: 0.05,
    remark:
      "**稳定增长型→缓慢增长型**，景气度↘，行业成熟期，应收款恶化，中性情况下预计5%dy+5%eps=10%cagr，股息率5%以上合理",
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.052, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.035, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 赛轮轮胎
    code: "601058",
    tags: [
      { tag: TagKey.EXPORT, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.5 },
    ],
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 3.5,
    sharesHeld: 1200,
    url: "/value-investing/industry/汽车/轮胎/赛轮轮胎/",
    dividendPerYear: 2,
    remark:
      "**快速增长型**，景气度↗，关注天胶价格和海外产能爬坡，中性情况下预计2%dy+10%~15%eps=12%~17%cagr，PE 12倍左右合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PRICE,
      price: [
        { value: 11.22, quantity: 200 }, // 11.22 已经买了 200 股
        { value: 10.62, quantity: 400 },
      ],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 15, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 10,
    },
  },
  {
    // 申洲国际
    code: "02313",
    tags: [
      { tag: TagKey.EXPORT, weight: 1 },
      { tag: TagKey.FX, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.2 },
    ],
    industry: Industry.TEXTILES_AND_APPAREL,
    qualityScore: 3.5,
    sharesHeld: 300,
    url: "/value-investing/industry/纺织服饰/服装代工/申洲国际/",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    remark:
      "**稳定增长型**，景气度↓，汇兑+油价+订单疲弱，中性情况下预计5%dy+3%~5%eps=8%~10%cagr，当前承压（H1盈利预警-38%~-43%），股息率5%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        {
          value: 0.055,
          quantity: 200,
        },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 泡泡玛特
    code: "09992",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.LOW_LIQUIDITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.9 },
    ],
    industry: Industry.POP_TOYS,
    qualityScore: 3,
    url: "/value-investing/industry/轻工制造/潮玩/泡泡玛特/",
    dividendPerYear: 1,
    dividendAdjust: 0.8,
    remark:
      "**快速增长型**，景气度↘，增速自然回落，IP依赖度高，中性情况下预计2%dy+10%~15%eps=12%~17%cagr，PE 15倍左右合理（目前不懂不投）",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 140, quantity: 200 }],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 22, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 12,
    },
  },
  {
    // 贵州茅台
    code: "600519",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.9 },
    ],
    industry: Industry.BAIJIU,
    qualityScore: 5,
    url: "/value-investing/industry/食品饮料/白酒/贵州茅台/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↗，批价企稳提价增厚，中性情况下预计4%dy+4%~7%eps=8%~11%cagr，PE 18倍左右合理",
    maxPositionRatio: 0.2,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.045, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.03, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.045,
    },
  },
  {
    // 泸州老窖
    code: "000568",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 1 },
    ],
    industry: Industry.BAIJIU,
    qualityScore: 3.5,
    url: "/value-investing/industry/食品饮料/白酒/泸州老窖/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↓，行业主动出清，批价倒挂，中性情况下预计6%dy+0%~3%eps=6%~9%cagr，当前承压（净利-19%），股息率6%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.08, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.08,
    },
  },
  {
    // 山西汾酒
    code: "600809",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 1 },
    ],
    industry: Industry.BAIJIU,
    qualityScore: 3.5,
    url: "/value-investing/industry/食品饮料/白酒/山西汾酒/",
    dividendPerYear: 1,
    remark:
      "**周期型**，景气度↘，筑底企稳，合同负债改善，中性情况下预计6%dy+0%~3%eps=6%~9%cagr，当前承压（净利-19%），合同负债+35.9%现企稳信号，股息率6%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.065, quantity: 100 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.07,
    },
  },
  {
    // 古井贡B
    code: "200596",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.LOW_LIQUIDITY, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 1 },
    ],
    industry: Industry.BAIJIU,
    qualityScore: 3.5,
    sharesHeld: 1000,
    url: "/value-investing/industry/食品饮料/白酒/古井贡/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↓，区域次高端承压，合同负债下降，中性情况下预计6%dy+0%~3%eps=6%~9%cagr，当前承压（净利-31%），股息率6%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 50, quantity: 1000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.045, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 宇通客车
    code: "600066",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.4 },
    ],
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 3,
    sharesHeld: 400,
    url: "/value-investing/industry/汽车/商用车/宇通客车/",
    dividendPerYear: 2,
    remark:
      "**快速增长型→稳定增长型**，景气度→，出口高增对冲国内萎缩，海外面临国内车企激烈竞争，中性情况下预计8%dy+0%~3%eps=8%~11%cagr，股息率8%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.1, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.06, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.1,
    },
  },
  {
    // 伊利股份
    code: "600887",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.6 },
    ],
    industry: Industry.DAIRY_PRODUCTS,
    qualityScore: 3.5,
    sharesHeld: 200,
    url: "/value-investing/industry/食品饮料/乳制品/伊利股份/",
    dividendPerYear: 2,
    remark:
      "**缓慢增长型**，景气度→，奶价企稳行业筑底，消费萎靡，中性情况下预计5%dy+2%~5%eps=7%~10%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        // { value: 0.058, quantity: 200 }, // 已买
        { value: 0.06, quantity: 200 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 中国神华A
    code: "601088",
    tags: [
      { tag: TagKey.COMMODITY, weight: 0.75 },
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.05 },
    ],
    industry: Industry.COAL,
    qualityScore: 4,
    url: "/value-investing/industry/煤炭/中国神华/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↗，煤电运化一体化对冲，中性情况下预计5%dy+0%~3%eps=5%~8%cagr，短期向好（煤价↑），股息率5%以上合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.05, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.035, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.05,
    },
  },
  {
    // 中国神华H
    code: "01088",
    tags: [
      { tag: TagKey.COMMODITY, weight: 0.75 },
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.05 },
    ],
    industry: Industry.COAL,
    qualityScore: 4,
    url: "/value-investing/industry/煤炭/中国神华/",
    dividendPerYear: 2,
    dividendAdjust: 0.72,
    remark:
      "**周期型**，景气度↗，煤电运化一体化对冲，中性情况下预计5%dy+0%~3%eps=5%~8%cagr，短期向好（煤价↑），股息率5%以上合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        { value: 0.055, quantity: 300 },
        { value: 0.06, quantity: 500 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.035, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 陕西煤业
    code: "601225",
    tags: [
      { tag: TagKey.COMMODITY, weight: 1 },
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.05 },
    ],
    industry: Industry.COAL,
    qualityScore: 3,
    url: "/value-investing/industry/煤炭/陕西煤业/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↑，煤价上行低成本龙头，中性情况下预计5%dy+5%~8%eps=10%~13%cagr，短期向好（煤价上行，净利预增），股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        { value: 0.05, quantity: 500 },
        { value: 0.055, quantity: 800 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.035, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 中国平安
    code: "601318",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.3 },
    ],
    industry: Industry.INSURANCE,
    qualityScore: 3.5,
    sharesHeld: 600,
    url: "/value-investing/industry/非银金融/保险/中国平安/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↗，寿险NBV增长，关注利率和代理人，中性情况下预计5%dy+3%~5%eps=8%~10%cagr，股息率5%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.06, quantity: 500 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 安踏体育
    code: "02020",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.9 },
    ],
    industry: Industry.TEXTILES_AND_APPAREL,
    qualityScore: 4,
    sharesHeld: 200,
    url: "/value-investing/industry/纺织服饰/运动鞋服/安踏体育/",
    dividendAdjust: 0.8,
    dividendPerYear: 2,
    remark:
      "**快速增长型→稳定增长型**，景气度→，多品牌矩阵分化，中性情况下预计3%dy+8%~10%eps=11%~13%cagr，PE 13倍左右合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PRICE,
      price: [
        { value: 64, quantity: 200 },
        { value: 60, quantity: 400 },
      ],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 18, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 12,
    },
  },
  {
    // 小商品城
    code: "600415",
    tags: [
      { tag: TagKey.EXPORT, weight: 1 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.2 },
    ],
    industry: Industry.ENTERPRISE_SERVICES,
    qualityScore: 3,
    sharesHeld: 2300,
    url: "/value-investing/industry/商贸零售/商贸市场/小商品城/",
    dividendPerYear: 1,
    remark:
      "**稳定增长型**，景气度→，外贸出口高企，贸易毛利极薄，中性情况下预计4%dy+6%~8%eps=10%~12%cagr，股息率4%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [
        // { value: 0.052, quantity: 500 }, // 已买
        { value: 0.056, quantity: 600 },
      ],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.035, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.055,
    },
  },
  {
    // 中国通信服务
    code: "00552",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.LOW_LIQUIDITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.TELECOMMUNICATION_SERVICES,
    qualityScore: 3,
    url: "",
    dividendAdjust: 0.8,
    dividendPerYear: 1,
    remark:
      "**缓慢增长型**，景气度→，运营商资本开支趋稳，中性情况下预计6%dy+3%~5%eps=9%~11%cagr，股息率6%以上合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.06, quantity: 2000 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 中远海控A
    code: "601919",
    tags: [
      { tag: TagKey.EXPORT, weight: 1 },
      { tag: TagKey.FX, weight: 0.75 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.SHIPPING,
    qualityScore: 2,
    sharesHeld: 200,
    url: "/value-investing/industry/交通运输/航运/中远海控/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↗（地缘+抢运支撑），运价两年新高，中性情况下预计8%dy+0%eps=8%cagr，周期股看PB，当前运价高位不可持续，股息率8%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.09, quantity: 500 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.05, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.09,
    },
  },
  {
    // 中远海控H
    code: "01919",
    tags: [
      { tag: TagKey.EXPORT, weight: 1 },
      { tag: TagKey.FX, weight: 0.75 },
      { tag: TagKey.COMMODITY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.SHIPPING,
    qualityScore: 2,
    sharesHeld: 1000,
    url: "/value-investing/industry/交通运输/航运/中远海控/",
    dividendAdjust: 0.8,
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↗（地缘+抢运支撑），运价两年新高，中性情况下预计8%dy+0%eps=8%cagr，周期股看PB，当前运价高位不可持续，股息率8%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.09, quantity: 500 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.05, quantity: 500 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.09,
    },
  },
  {
    // 比亚迪
    code: "002594",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.7 },
    ],
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 3.5,
    sharesHeld: 100,
    url: "/value-investing/industry/汽车/乘用车/比亚迪/",
    dividendPerYear: 1,
    maxPositionRatio: 0.05,
    remark:
      "**快速增长型→稳定增长型**，景气度↘，国内价格战，海外+出口对冲，中性情况下预计1%dy+10%~15%eps=11%~16%cagr，当前承压（Q1净利-55%），长期看海外放量，PE 22倍左右合理",
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 62, quantity: 100 }],
    },
    exit: {
      type: PlanType.PRICE,
      price: [{ value: 120, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 62,
    },
  },
  {
    // 香港交易所
    code: "00388",
    tags: [
      { tag: TagKey.RATE, weight: 0.5 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.2 },
    ],
    industry: Industry.FINANCIAL,
    qualityScore: 4.5,
    url: "/value-investing/industry/非银金融/交易所/港交所/",
    dividendPerYear: 1,
    remark:
      "**周期成长型**，景气度↑，ADT周期上行，中性情况下预计3%dy+8%~10%eps=11%~13%cagr，短期向好（ADT+17.8%），PE 25倍左右合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.PE,
      pe: [{ value: 21, quantity: 100 }],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 30, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 21,
    },
  },
  {
    // 国电南瑞
    code: "600406",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.POLICY, weight: 0.75 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.ELECTRIC_POWER,
    qualityScore: 4,
    url: "/value-investing/industry/电力设备/电网设备/国电南瑞/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↑，电网投资高景气，增收不增利，中性情况下预计2.2%dy+6%~9%eps=8.2%~11.2%cagr，PE 18倍左右合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PE,
      pe: [{ value: 18, quantity: 200 }],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 30, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 18,
    },
  },
  {
    // 宁德时代
    code: "300750",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.4 },
    ],
    industry: Industry.AUTOMOTIVE_AND_PARTS,
    qualityScore: 4,
    url: "/value-investing/industry/电力设备/电池/宁德时代/",
    dividendPerYear: 2,
    remark:
      "**快速增长型**，景气度↑，储能高增，全球市占率第一，中性情况下预计1.5%dy+15%~20%eps=16.5%~21.5%cagr，PE 19倍左右合理",
    maxPositionRatio: 0.1,
    plan: {
      type: PlanType.PE,
      pe: [{ value: 15, quantity: 100 }],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 28, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 15,
    },
  },
  {
    // 农夫山泉
    code: "09633",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.7 },
    ],
    industry: Industry.BEVERAGE,
    qualityScore: 4.5,
    url: "/value-investing/industry/食品饮料/饮料/农夫山泉/",
    dividendPerYear: 1,
    dividendAdjust: 0.8,
    remark:
      "**快速增长型→稳定增长型**，景气度→，无糖茶高增，中性情况下预计2.6%dy+10%~12%eps=12.6%~14.6%cagr，PE 20倍左右合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PE,
      pe: [{ value: 20, quantity: 400 }],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 35, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 20,
    },
  },
  {
    // 东鹏饮料
    code: "605499",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.7 },
    ],
    industry: Industry.BEVERAGE,
    qualityScore: 3.5,
    url: "/value-investing/industry/食品饮料/饮料/东鹏饮料/",
    dividendPerYear: 2,
    remark:
      "**快速增长型→稳定增长型**，景气度↘，能量饮料增速回落，茶饮接棒，中性情况下预计4.3%dy+10%~15%eps=14.3%~19.3%cagr，PE 16倍左右合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PE,
      pe: [{ value: 16, quantity: 100 }],
    },
    exit: {
      type: PlanType.PE,
      pe: [{ value: 30, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.PE,
      value: 16,
    },
  },
  {
    // 云天化
    code: "600096",
    tags: [
      { tag: TagKey.COMMODITY, weight: 1 },
      { tag: TagKey.DOMESTIC, weight: 0.75 },
      { tag: TagKey.EXPORT, weight: 0.25 },
      { tag: TagKey.POLICY, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.1 },
    ],
    industry: Industry.BEVERAGE,
    qualityScore: 2.5,
    url: "/value-investing/industry/基础化工/化肥农药/云天化/",
    dividendPerYear: 2,
    remark:
      "**周期型**，景气度↓，硫磺高价+出口暂停，磷矿资源强，中性情况下预计5%dy+3%eps=8%cagr，当前承压（硫磺同比+269%+出口暂停），股息率5%以上合理",
    maxPositionRatio: 0.03,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.06, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 100 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.06,
    },
  },
  {
    // 万华化学
    code: "600309",
    tags: [
      { tag: TagKey.COMMODITY, weight: 1 },
      { tag: TagKey.DOMESTIC, weight: 0.5 },
      { tag: TagKey.EXPORT, weight: 0.5 },
      { tag: TagKey.FX, weight: 0.5 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.15 },
    ],
    industry: Industry.MATERIALS,
    qualityScore: 3.5,
    url: "/value-investing/industry/基础化工/化工新材料/万华化学/",
    remark:
      "**周期型**，景气度↑，MDI涨价驱动，重资产高负债，中性情况下预计1.6%dy+8%~10%eps=9.6%~11.6%cagr，短期向好（MDI涨价），PE 13倍左右合理",
    dividendPerYear: 2,
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.PRICE,
      price: [{ value: 60, quantity: 200 }],
    },
    exit: {
      type: PlanType.PRICE,
      price: [{ value: 100, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 60,
    },
  },
  {
    // 海康威视
    code: "002415",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 0.75 },
      { tag: TagKey.EXPORT, weight: 0.25 },
      { tag: TagKey.POLICY, weight: 0.75 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.2 },
    ],
    industry: Industry.SECURITY,
    qualityScore: 3.5,
    url: "/value-investing/industry/电子/安防/海康威视/",
    dividendPerYear: 2,
    remark:
      "**稳定增长型**，景气度↗，创新业务驱动，海外承压，中性情况下预计3%dy+3%~5%eps=6%~8%cagr，PE 18倍左右合理",
    maxPositionRatio: 0.05,
    plan: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.04, quantity: 200 }],
    },
    exit: {
      type: PlanType.DIVIDEND,
      dividend: [{ value: 0.02, quantity: 200 }],
    },
    strikePrice: {
      type: PlanType.DIVIDEND,
      value: 0.04,
    },
  },
  {
    // 恒生科技ETF
    code: "513180",
    tags: [
      { tag: TagKey.DOMESTIC, weight: 1 },
      { tag: TagKey.CONSUMER_SENSITIVITY, weight: 0.6 },
    ],
    industry: Industry.ETF,
    qualityScore: 2.5,
    sharesHeld: 5000,
    remark:
      "**一篮子互联网科技**，景气度→，高波动高弹性，不追求股息，中性情况下预计10%eps=10%cagr，PE20倍左右合理",
    maxPositionRatio: 0.01,
    plan: {
      type: PlanType.PRICE,
      price: [],
    },
    exit: {
      type: PlanType.PRICE,
      price: [],
    },
    strikePrice: {
      type: PlanType.PRICE,
      value: 0.5,
    },
  },
  /**
   * TODO:
   * 古茗
   * 新奥能源
   * 中国财险
   * 卫龙美味
   */
];

/** 剩余现金（人民币），在持仓组合中作为"现金"显示，参与总市值和比例计算 */
export const cash = ref(69000);

export { stocks };
