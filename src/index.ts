/* istanbul ignore file */
import path from "path";
import os from "os";

import { Options, Configuration } from "./types";
import generateDocFromSchema from "./lib/generator";
import { Command } from "commander";

const DEFAULT_OPTIONS: Configuration = {
  schema: "./schema.graphql",
  rootPath: "./docs",
  baseURL: "schema",
  linkRoot: "/",
  homepage: path.join(__dirname, "../assets/", "generated.md"),
  diffMethod: "SCHEMA-DIFF",
  tmpDir: path.join(os.tmpdir(), "@edno/docusaurus2-graphql-doc-generator"),
};

export default function pluginGraphQLDocGenerator(
  _: never,
  opts: Configuration
): any {
  return {
    name: "docusaurus-graphql-doc-generator",

    extendCli(cli: Command): void {
      cli
        .command("graphql-to-doc")
        .option(
          "-s, --schema <schema>",
          "Schema location",
          opts.schema || DEFAULT_OPTIONS.schema
        )
        .option(
          "-r, --root <rootPath>",
          "Root folder for doc generation",
          opts.rootPath || DEFAULT_OPTIONS.rootPath
        )
        .option(
          "-b, --base <baseURL>",
          "Base URL to be used by Docusaurus",
          opts.baseURL || DEFAULT_OPTIONS.baseURL
        )
        .option(
          "-l, --link <linkRoot>",
          "Root for links in documentation",
          opts.linkRoot || DEFAULT_OPTIONS.linkRoot
        )
        .option(
          "-h, --homepage <homepage>",
          "File location for doc landing page",
          opts.homepage || DEFAULT_OPTIONS.homepage
        )
        .option("-f, --force", "Force document generation")
        .option(
          "-d, --diff <diffMethod>",
          "Set diff method",
          opts.diffMethod || DEFAULT_OPTIONS.diffMethod
        )
        .option(
          "-t, --tmp <tmpDir>",
          "Set temp dir for schema diff",
          opts.tmpDir || DEFAULT_OPTIONS.tmpDir
        )
        .description("Generate GraphQL Schema Documentation")
        .action(
          async (options: Options): Promise<void> => {
            const baseURL = options.base;
            const linkRoot = options.link;
            const schema = options.schema;
            const rootPath = path.join(options.root, baseURL);
            const homepage = options.homepage;
            const diffMethod = options.force ? "FORCE" : options.diff;
            const tmpDir = options.tmp;
            await generateDocFromSchema(
              baseURL,
              schema,
              rootPath,
              linkRoot,
              homepage,
              diffMethod,
              tmpDir
            );
          }
        );
    },
  };
}
