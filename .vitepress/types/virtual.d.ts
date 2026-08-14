declare module "virtual:industry-tree" {
  type CompanyNode = { name: string; route: string };
  type SegmentNode = {
    name: string;
    route: string;
    companies: CompanyNode[];
  };
  type IndustryNode = {
    name: string;
    route: string;
    segments: SegmentNode[];
    companies: CompanyNode[];
  };
  const tree: IndustryNode[];
  export default tree;
}

declare module "virtual:company-files" {
  type CompanyFileEntry = {
    name: string;
    label: string;
    link: string;
  };
  type CompanyFilesData = {
    files: CompanyFileEntry[];
    tracking: CompanyFileEntry[];
    notes: CompanyFileEntry[];
  };
  const map: Record<string, CompanyFilesData>;
  export default map;
}
