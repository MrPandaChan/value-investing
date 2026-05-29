export enum PlanType {
  PRICE,
  DIVIDEND,
}

interface PlanEntry {
  value: number;
  quantity: number; // 计划买入股数
}

interface BasePlan {
  code: string;
  url?: string;
  remark?: string;
  /** 一年分红次数，设置后仅展示和计算最新的 n 条分红数据 */
  dividendPerYear?: number;
  /**
   * 年分红调整系数，与年分红相乘得到调整后年分红，
   * 调整后年分红用于股息率反推股价
   */
  dividendAdjust?: number;
}

interface PricePlan extends BasePlan {
  type: PlanType.PRICE;
  price: PlanEntry[];
}

interface DividendPlan extends BasePlan {
  type: PlanType.DIVIDEND;
  dividend: PlanEntry[];
}

type PlanItem = PricePlan | DividendPlan;

const planList: PlanItem[] = [
  {
    // 腾讯控股
    type: PlanType.PRICE,
    code: "00700",
    dividendAdjust: 0.72,
    url: "/value-investing/company/internet/tencent",
    price: [
      { value: 400, quantity: 200 },
      { value: 380, quantity: 100 },
      { value: 360, quantity: 100 },
    ],
  },
  {
    // 福耀玻璃
    type: PlanType.PRICE,
    code: "600660",
    price: [
      { value: 50, quantity: 300 },
      { value: 48, quantity: 400 },
      { value: 46, quantity: 400 },
    ],
  },
  {
    // 云南白药
    type: PlanType.PRICE,
    code: "000538",
    price: [{ value: 46.5, quantity: 400 }],
  },
  {
    // 分众传媒
    type: PlanType.DIVIDEND,
    code: "002027",
    dividend: [
      { value: 0.065, quantity: 1000 },
      { value: 0.07, quantity: 2000 },
      { value: 0.075, quantity: 3000 },
    ],
  },
  // 青岛港H
  {
    type: PlanType.DIVIDEND,
    code: "06198",
    dividendPerYear: 2,
    dividendAdjust: 0.8,
    dividend: [
      {
        value: 0.047,
        quantity: 2000,
      },
    ],
  },
  // 青岛港A
  {
    type: PlanType.DIVIDEND,
    code: "601298",
    dividendPerYear: 2,
    dividend: [
      {
        value: 0.047,
        quantity: 2000,
      },
    ],
  },
  // 永新股份
  {
    type: PlanType.PRICE,
    code: "002014",
    remark: "2025年分红率有降低，分红比过去两年低",
    price: [
      {
        value: 10.2,
        quantity: 900,
      },
      {
        value: 9.7,
        quantity: 1200,
      },
      {
        value: 9.2,
        quantity: 1500,
      },
    ],
  },
  // 招商银行
  {
    type: PlanType.PRICE,
    code: "600036",
    dividendPerYear: 2,
    remark: "预计07-15左右分红，分完后计划减1块",
    price: [
      {
        value: 36.5,
        quantity: 600,
      },
      {
        value: 35.5,
        quantity: 800,
      },
    ],
  },
  // 美的集团
  {
    type: PlanType.PRICE,
    code: "000333",
    dividendPerYear: 2,
    remark: "预计6月15左右分红",
    price: [
      {
        value: 75,
        quantity: 400,
      },
      {
        value: 71,
        quantity: 600,
      },
    ],
  },
  // 海尔智家
  {
    type: PlanType.PRICE,
    code: "600690",
    dividendPerYear: 2,
    remark: "预计7月/8月分红",
    price: [
      {
        value: 19.5,
        quantity: 1000,
      },
    ],
  },
  // 格力电器
  {
    type: PlanType.PRICE,
    code: "000651",
    dividendPerYear: 2,
    remark: "预计8月分红",
    price: [
      {
        value: 37,
        quantity: 200,
      },
    ],
  },
  // 中国移动
  {
    type: PlanType.PRICE,
    code: "600941",
    dividendPerYear: 2,
    price: [
      {
        value: 92,
        quantity: 200,
      },
    ],
  },
  // 中国电信
  {
    type: PlanType.DIVIDEND,
    code: "601728",
    dividendPerYear: 2,
    remark: "预计9月初分红",
    dividend: [
      {
        value: 0.05,
        quantity: 2000,
      },
    ],
  },
  // 中国铁塔
  {
    type: PlanType.DIVIDEND,
    code: "00788",
    dividendPerYear: 2,
    dividendAdjust: 0.8 * 1.3,
    remark: "0.8 × 1.3 预计今年30%增长",
    dividend: [
      {
        value: 0.055,
        quantity: 1000,
      },
      {
        value: 0.06,
        quantity: 2000,
      },
    ],
  },
  // 长江电力
  {
    type: PlanType.DIVIDEND,
    code: "600900",
    dividendPerYear: 2,
    remark: "预计7月中分红",
    dividend: [
      {
        value: 0.04,
        quantity: 1200,
      },
    ],
  },
  // 国投电力
  {
    type: PlanType.DIVIDEND,
    code: "600886",
    dividendPerYear: 1,
    remark: "预计8月分红",
    dividend: [
      {
        value: 0.04,
        quantity: 2000,
      },
    ],
  },
];

export { planList };
