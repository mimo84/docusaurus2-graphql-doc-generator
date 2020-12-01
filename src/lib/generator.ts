import chalk from "chalk";
import {
  getSchemaMap,
  loadSchema,
  GraphQLFileLoader,
  UrlLoader,
  JsonFileLoader,
} from "./graphql";
import Renderer from "./renderer";
import Printer from "./printer";
import { round } from "./utils";
import { checkSchemaChanges, saveSchemaHash, saveSchemaFile } from "./diff";
import { DocPage } from "../types";

const time = process.hrtime();

export default async function generateDocFromSchema(
  baseURL: string,
  schemaLocation: string,
  outputDir: string,
  linkRoot: string,
  homepageLocation: string,
  diffMethod: string,
  tmpDir: string
): Promise<void> {
  return Promise.resolve(
    loadSchema(schemaLocation, {
      loaders: [new GraphQLFileLoader(), new UrlLoader(), new JsonFileLoader()],
    })
  ).then(async (schema) => {
    if (await checkSchemaChanges(schema, tmpDir, diffMethod)) {
      let pages: DocPage[] = [];
      const r = new Renderer(
        new Printer(schema, baseURL, linkRoot),
        outputDir,
        baseURL
      );
      const rootTypes = getSchemaMap(schema);
      Promise.all(
        Object.keys(rootTypes).map((typeName: string) =>
          r.renderRootTypes(typeName, (rootTypes as any)[typeName])
        )
      )
        .then((p) => {
          pages = p.reduce((r: DocPage[], i: DocPage[]) => r.concat(i), []);
        })
        .then(async () => await r.renderHomepage(homepageLocation))
        .then(async () => await r.renderSidebar(pages))
        .then((sidebarPath) => {
          const [sec, msec] = process.hrtime(time);
          const duration = round(sec + msec / 1000000000, 3);
          console.info(
            chalk.green(
              `Documentation successfully generated in "${outputDir}" with base URL "${baseURL}".`
            )
          );
          console.log(
            chalk.blue(
              `${pages.length} pages generated in ${duration}s from schema "${schemaLocation}".`
            )
          );
          console.info(
            chalk.blue.bold(
              `Remember to update your Docusaurus site's sidebars with "${sidebarPath}".`
            )
          );
        });
    } else {
      console.info(
        chalk.blue(`No changes detected in schema "${schemaLocation}".`)
      );
    }
    // create references for checkSchemaChanges
    await saveSchemaHash(schema, tmpDir);
    await saveSchemaFile(schema, tmpDir);
  });
}
