/* eslint-disable @typescript-eslint/no-explicit-any */
export type DocPage = {
  category: string;
  slug: string;
};

export type DocusaurusDocSidebarDocEntry = {
  type: "doc";
  id: string;
  label?: string;
};

export type DocusaurusDocSidebarCategoryEntry = {
  type: "category";
  label: string;
  items?: any;
};

export type DocusaurusDocSidebarEntry =
  | DocusaurusDocSidebarDocEntry
  | DocusaurusDocSidebarCategoryEntry;

export type DocusaurusDocSidebar = DocusaurusDocSidebarEntry[];

export type Configuration = {
  schema?: string;
  rootPath?: string;
  baseURL?: string;
  linkRoot?: string;
  homepage?: string;
  diffMethod?: string;
  tmpDir?: string;
};

export type Options = {
  schema: string;
  root: string;
  base: string;
  link: string;
  homepage: string;
  diff: "FORCE" | "SCHEMA_DIFF" | "SCHEMA-HASH";
  tmp: string;
  force: boolean;
};
