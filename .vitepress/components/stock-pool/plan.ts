export enum PlanType {
  PRICE,
  DIVIDEND,
}

interface PlanEntry {
  value: number;
  quantity: number; // 计划买入股数
  remark?: string;
}

interface BasePlan {
  code: string;
  url?: string;
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
];

export { planList };
