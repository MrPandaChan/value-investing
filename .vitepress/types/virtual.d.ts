declare module "virtual:industry-tree" {
  const tree: {
    name: string;
    route: string;
    companies: { name: string; route: string }[];
  }[];
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
