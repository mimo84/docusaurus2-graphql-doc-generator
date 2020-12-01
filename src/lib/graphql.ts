import {
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLScalarType,
  isListType,
  GraphQLID,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
  GraphQLNamedType,
  GraphQLSchema,
  GraphQLFieldMap,
  isObjectType,
} from "graphql";
import { Maybe } from "graphql/jsutils/Maybe";
import { TypeMap } from "graphql/type/schema";
export { loadSchema } from "@graphql-tools/load";
export { GraphQLFileLoader } from "@graphql-tools/graphql-file-loader";
export { UrlLoader } from "@graphql-tools/url-loader";
export { JsonFileLoader } from "@graphql-tools/json-file-loader";

import { toArray } from "./utils";

export const SCHEMA_EXCLUDE_LIST_PATTERN = /^(?!Query$|Mutation$|Subscription$|__.+$).*$/;

export function getDefaultValue(argument: {
  type: any;
  defaultValue: any;
}): Maybe<string> {
  if (isListType(argument.type)) {
    return `[${argument.defaultValue || ""}]`;
  }

  switch (argument.type) {
    case GraphQLID:
    case GraphQLInt:
      return `${argument.defaultValue || "0"}`;
    case GraphQLFloat:
      return `${argument.defaultValue || "0.0"}`;
    case GraphQLString:
    default:
      return argument.defaultValue ? `"${argument.defaultValue}"` : undefined;
  }
}

export function getFilteredTypeMap(
  typeMap: TypeMap,
  excludeList = SCHEMA_EXCLUDE_LIST_PATTERN
): Maybe<TypeMap> {
  if (!typeMap) return undefined;
  return Object.keys(typeMap)
    .filter((key: string) => excludeList.test(key))
    .reduce((res: any, key: string) => ((res[key] = typeMap[key]), res), {});
}

export function getIntrospectionFieldsList(
  type: Maybe<GraphQLObjectType>
): Maybe<GraphQLFieldMap<any, any>> {
  if (!isObjectType(type) || !("getFields" in type)) {
    return undefined;
  }
  return type.getFields();
}

export function getFields(type: GraphQLNamedType): any[] {
  if (!("getFields" in type)) {
    return [];
  }
  const fieldMap = type.getFields();
  return Object.keys(fieldMap).map((name) => fieldMap[name]);
}

export function getTypeName(
  type: GraphQLNamedType,
  defaultName?: Maybe<string>
): Maybe<string> {
  if (!type) {
    return undefined;
  }
  return ("name" in type && type.name) || type.toString() || defaultName || "";
}

export function getTypeFromTypeMap(
  typeMap: TypeMap,
  type: any
): Maybe<GraphQLNamedType[]> {
  if (!typeMap) {
    return undefined;
  }
  return Object.keys(typeMap)
    .filter((key: string) => typeMap[key] instanceof type || false)
    .reduce((res: any, key: string) => ((res[key] = typeMap[key]), res), {});
}

export function getSchemaMap(schema: GraphQLSchema): any {
  const typeMap = getFilteredTypeMap(schema.getTypeMap()) as TypeMap;
  return {
    queries: getIntrospectionFieldsList(schema.getQueryType()),
    mutations: getIntrospectionFieldsList(schema.getMutationType()),
    subscriptions: getIntrospectionFieldsList(schema.getSubscriptionType()),
    directives: toArray(schema.getDirectives && schema.getDirectives()),
    objects: getTypeFromTypeMap(typeMap, GraphQLObjectType),
    unions: getTypeFromTypeMap(typeMap, GraphQLUnionType),
    interfaces: getTypeFromTypeMap(typeMap, GraphQLInterfaceType),
    enums: getTypeFromTypeMap(typeMap, GraphQLEnumType),
    inputs: getTypeFromTypeMap(typeMap, GraphQLInputObjectType),
    scalars: getTypeFromTypeMap(typeMap, GraphQLScalarType),
  };
}

export function isParametrizedField(field: GraphQLNamedType): boolean {
  return "args" in field && (field as any).args.length > 0;
}

export function isOperation(query: GraphQLNamedType): boolean {
  return "type" in query;
}

export {
  isDirective as isDirectiveType,
  isObjectType,
  getNamedType,
  isScalarType,
  isEnumType,
  isUnionType,
  isInterfaceType,
  isInputType,
  isNullableType,
  isListType,
  printSchema,
} from "graphql";
