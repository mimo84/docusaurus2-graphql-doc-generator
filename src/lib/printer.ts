import { GraphQLNamedType, GraphQLSchema } from "graphql";
import path from "path";
import {
  isEnumType,
  isUnionType,
  isObjectType,
  isScalarType,
  isOperation,
  getDefaultValue,
  getTypeName,
  getFields,
  isDirectiveType,
  isParametrizedField,
  isInterfaceType,
  getNamedType,
  isInputType,
  isListType,
} from "./graphql";
import { toSlug } from "./utils";
import { prettifyMarkdown } from "./prettier";

enum STYLE {
  TITLE = "###",
  SUB_TITLE = "####",
  LIST_ITEM = "- #####",
}
const NO_DESCRIPTION_TEXT = "No description";

const TAG = `
export const Tag = ({children, color}) => (
  <span
    style={{
      backgroundColor: color,
      borderRadius: '2px',
      color: '#fff',
      padding: '0.2rem',
    }}>
    {children}
  </span>
);`;

export default class Printer {
  constructor(
    private schema: GraphQLSchema,
    private baseURL: string,
    private linkRoot: string = "/"
  ) {}

  toLink(type: GraphQLNamedType, name: string): string {
    let graphLQLNamedType: GraphQLNamedType = getNamedType(type);
    if (isListType(type)) {
      graphLQLNamedType = getNamedType(type.ofType as GraphQLNamedType);
    }
    let category;
    switch (true) {
      case isEnumType(graphLQLNamedType):
        category = "enums";
        break;
      case isUnionType(graphLQLNamedType):
        category = "unions";
        break;
      case isInterfaceType(graphLQLNamedType):
        category = "interfaces";
        break;
      case isObjectType(graphLQLNamedType):
        category = "objects";
        break;
      case isInputType(graphLQLNamedType):
        category = "inputs";
        break;
      case isScalarType(graphLQLNamedType):
        category = "scalars";
        break;
      case isDirectiveType(graphLQLNamedType):
        category = "directives";
        break;
    }

    if (category && graphLQLNamedType) {
      return `[\`${name}\`](${path.join(
        this.linkRoot,
        this.baseURL,
        category,
        toSlug(graphLQLNamedType.toString())
      )})`;
    } else {
      return `\`${name}\``;
    }
  }

  printSection(
    values: any[],
    section: string,
    level: string = STYLE.TITLE
  ): string {
    if (values.length > 0)
      return `${level} ${section}\n\n${this.printSectionItems(values)}\n\n`;
    return "";
  }

  printSectionItems(values: any[], level: string = STYLE.SUB_TITLE): string {
    if (Array.isArray(values))
      return values
        .map((v) => v && this.printSectionItem(v, level))
        .join(`\n\n`);
    return "";
  }

  printSectionItem(type: any, level: string = STYLE.SUB_TITLE): string {
    if (!type) {
      return "";
    }

    let section = `${level} ${this.toLink(type, getTypeName(type) as string)} ${
      "type" in type
        ? `(${this.toLink(type.type, getTypeName(type.type) as string)})`
        : ""
    }\n\n${this.printDescription(type, "")}\n`;
    if (isParametrizedField(type)) {
      section += this.printSectionItems(type.args, STYLE.LIST_ITEM);
    }
    return section;
  }

  printCodeEnum(type: GraphQLNamedType): string {
    let code = "";
    if (isEnumType(type)) {
      code += `enum ${getTypeName(type)} {\n`;
      code += type
        .getValues()
        .map((v: any) => `  ${getTypeName(v)}`)
        .join("\n");
      code += `\n}`;
    }
    return code;
  }

  printCodeUnion(type: GraphQLNamedType): string {
    let code = "";
    if (isUnionType(type)) {
      code += `union ${getTypeName(type)} = `;
      code += type
        .getTypes()
        .map((v: any) => getTypeName(v))
        .join(" | ");
    }
    return code;
  }

  printCodeScalar(type: GraphQLNamedType): string {
    return `scalar ${getTypeName(type)}`;
  }

  printCodeArguments(type: any): string {
    let code = "";
    if (isParametrizedField(type)) {
      code += `(\n`;
      code += type.args.reduce((r: any, v: any) => {
        const defaultValue = getDefaultValue(v);
        return `${r}  ${v.name}: ${v.type.toString()}${
          defaultValue ? ` = ${defaultValue}` : ""
        }\n`;
      }, "");
      code += `)`;
    }
    return code;
  }

  printCodeField(type: any): string {
    let code = `${getTypeName(type)}`;
    code += this.printCodeArguments(type);
    code += `: ${getTypeName(type.type)}\n`;
    return code;
  }

  printCodeDirective(type: GraphQLNamedType): string {
    let code = `directive @${getTypeName(type)}`;
    code += this.printCodeArguments(type);
    return code;
  }

  printCodeType(type: GraphQLNamedType): string {
    let code = `${isInterfaceType(type) ? "interface" : "type"} ${getTypeName(
      type
    )}`;
    code += `${
      "getInterfaces" in type && type.getInterfaces().length > 0
        ? ` implements ${type
            .getInterfaces()
            .map((v: any) => getTypeName(v))
            .join(", ")}`
        : ""
    }`;
    code += ` {\n`;
    code += getFields(type)
      .map((v) => `  ${this.printCodeField(v)}`)
      .join("");
    code += `}`;

    return code;
  }

  printHeader(id: string, title: string): string {
    return `---\nid: ${id}\ntitle: ${title}\n---\n`;
  }

  printDeprecation(type: GraphQLNamedType): string {
    if ("isDeprecated" in type) {
      return `<sub><sup><Tag color="#ffba00">DEPRECATED</Tag> ${
        (type as any).deprecationReason
      }</sup></sub>\n\n`;
    }
    return "";
  }

  printDescription(
    type: GraphQLNamedType,
    noText: string = NO_DESCRIPTION_TEXT
  ): string {
    let description = "";

    description = `${this.printDeprecation(type)}${
      type?.description || noText
    }`;

    return description;
  }

  printCode(type: GraphQLNamedType): string {
    let code = "\n```graphql\n";
    switch (true) {
      case isEnumType(type):
        code += this.printCodeEnum(type);
        break;
      case isUnionType(type):
        code += this.printCodeUnion(type);
        break;
      case isInterfaceType(type):
      case isObjectType(type):
      case isInputType(type):
        code += this.printCodeType(type);
        break;
      case isScalarType(type):
        code += this.printCodeScalar(type);
        break;
      case isDirectiveType(type):
        code += this.printCodeDirective(type);
        break;
      case isOperation(type):
        code += this.printCodeField(type);
        break;
      default:
        code += `"${getTypeName(type)}" not supported`;
    }
    code += "\n```\n";
    return code;
  }

  printType(name: string, type: GraphQLNamedType): string {
    if (!type) {
      return "";
    }

    const header = this.printHeader(name, getTypeName(type) as string);
    const description = this.printDescription(type);
    const code = this.printCode(type);

    let metadata = "";
    if (isEnumType(type)) {
      metadata = this.printSection(type.getValues(), "Values");
    }

    if (isUnionType(type)) {
      metadata = this.printSection(type.getTypes(), "Possible types");
    }

    if (isObjectType(type) || isInterfaceType(type) || isInputType(type)) {
      metadata = this.printSection(getFields(type), "Fields");
      if ("getInterfaces" in type) {
        metadata += this.printSection(type.getInterfaces(), "Interfaces");
      }
    }

    if (isOperation(type)) {
      metadata = this.printSection((type as any).args, "Arguments");
      const queryType = (getTypeName((type as any).type) as string).replace(
        /[![\]]*/g,
        ""
      );
      metadata += this.printSection([this.schema.getType(queryType)], "Type");
    }

    if (isDirectiveType(type)) {
      metadata = this.printSection(type.args, "Arguments");
    }

    return prettifyMarkdown(
      `${header}\n\n${TAG}\n\n${description}\n\n${code}\n\n${metadata}\n\n`
    );
  }
}
