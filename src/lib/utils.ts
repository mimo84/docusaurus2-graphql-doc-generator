import slugify from "slugify";
import { kebabCase } from "lodash";

export function toSlug(str: string): string {
  return slugify(kebabCase(str));
}

export function toArray(param: any): any | undefined {
  if (param && typeof param === "object")
    return Object.keys(param).map((key: string) => param[key]);
  return undefined;
}

export { kebabCase, startCase, round } from "lodash";
