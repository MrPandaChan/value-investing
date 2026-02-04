import { Stock } from "../../service/stock";

export enum RowType {
  STOCK,
  AREA,
}

export enum AreaType {
  SPECIAL_OFFER,
  HITTING,
}

export interface AreaRowType {
  rowType: RowType.AREA;
  areaType: AreaType;
  trClass: string;
  text: string;
}

export type TableRow = AreaRowType | Stock;
