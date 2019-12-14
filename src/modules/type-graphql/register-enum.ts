import { registerEnumType } from "type-graphql";

export function registerEnum(enumType: any, name: string, description: string) {
  return registerEnumType(enumType, {
    name, // This is mandatory
    description
  });
}
