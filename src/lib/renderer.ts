import { promises as fs } from "fs";
import { GraphQLNamedType } from "graphql";

import * as fse from "fs-extra";
import path from "path";
import { pull } from "lodash";
import moment from "moment";

import {
  DocPage,
  DocusaurusDocSidebarEntry,
  DocusaurusDocSidebar,
} from "../types";

import Printer from "./printer";
import { toSlug, startCase } from "./utils";
import { prettifyJavascript } from "./prettier";

const SIDEBAR = "sidebar-schema.js";
const HOMEPAGE_ID = "schema";

export default class Renderer {
  constructor(
    private printer: Printer,
    private outputDir: string,
    private baseURL: string
  ) {
    this.emptyOutputDir();
  }

  emptyOutputDir(): void {
    fse.emptyDirSync(this.outputDir);
  }

  async renderRootTypes(name: string, type: any): Promise<DocPage[]> {
    const pages: DocPage[] = [];
    if (type) {
      const slug = toSlug(name);
      const dirPath = path.join(this.outputDir, slug);
      if (Array.isArray(type)) {
        type = type.reduce(function (r, o) {
          if (o && o.name) r[o.name] = o;
          return r;
        }, {});
      }

      fse.ensureDir(dirPath);

      await Promise.all(
        Object.keys(type).map((name) =>
          this.renderTypeEntities(dirPath, name, type[name])
        )
      ).then((p: DocPage[]) => p && pages.concat(p));
    }
    return pages;
  }

  async renderTypeEntities(
    dirPath: string,
    name: string,
    type: GraphQLNamedType
  ): Promise<DocPage> {
    if (!type) {
      throw new Error("Not a type");
    }
    const fileName = toSlug(name);
    const filePath = path.join(dirPath, `${fileName}.mdx`);
    const content = this.printer.printType(fileName, type);
    await fs.writeFile(filePath, content, "utf8");
    const page = path
      .relative(this.outputDir, filePath)
      .match(/(?<category>[A-z][A-z0-9-]*)\/(?<pageId>[A-z][A-z0-9-]*).mdx?$/);
    if (!page || !page.groups) {
      throw new Error("Cannot find page information");
    }
    const slug = path.join(page.groups.category, page.groups.pageId);
    return { category: startCase(page.groups.category), slug: slug };
  }

  async renderSidebar(pages: any[]): Promise<string> {
    const filePath = path.join(this.outputDir, SIDEBAR);
    const content = prettifyJavascript(`module.exports = {
          schemaSidebar:
          ${JSON.stringify(this.generateSidebar(pages))}
        };`);
    await fs.writeFile(filePath, content, "utf8");
    return path.relative("./", filePath);
  }

  generateSidebar(pages: DocPage[]): DocusaurusDocSidebar {
    let graphqlSidebar: DocusaurusDocSidebar = [
      { type: "doc", id: path.join(this.baseURL, HOMEPAGE_ID) },
    ];
    pages.map((page) => {
      const category:
        | DocusaurusDocSidebarEntry
        | undefined = graphqlSidebar.find(
        (entry: DocusaurusDocSidebarEntry) =>
          "label" in entry && page.category == entry.label
      );
      if (category) {
        const items = ("items" in category && category.items) || [];
        const slug = path.join(this.baseURL, page.slug);
        graphqlSidebar = [
          ...pull(graphqlSidebar, category),
          {
            type: "category",
            label: page.category,
            items: [...items, slug].sort(),
          },
        ];
      }
    });
    return graphqlSidebar;
  }

  async renderHomepage(homepageLocation: string): Promise<void> {
    const homePage = path.basename(homepageLocation);
    const destLocation = path.join(this.outputDir, homePage);
    fse.copySync(homepageLocation, destLocation);
    const data = await fs.readFile(destLocation, "utf8");
    data.replace(
      /##generated-date-time##/gm,
      moment().format("MMMM DD, YYYY [at] h:mm:ss A")
    );
    await fs.writeFile(destLocation, data, "utf8");
  }
}
