declare module "virtual:industry-tree" {
  const tree: {
    name: string;
    route: string;
    companies: { name: string; route: string }[];
  }[];
  export default tree;
}
