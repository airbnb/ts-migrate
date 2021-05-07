import { JSONSchema7, validate } from 'json-schema';
import { PluginOptionsError } from 'ts-migrate-server';

export type Properties = JSONSchema7['properties'];

export type AnyAliasOptions = { anyAlias?: string };

export const anyAliasProperty: Properties = {
  anyAlias: { type: 'string' },
};

export type AnyFunctionAliasOptions = { anyFunctionAlias?: string };

export const anyFunctionAliasProperty: Properties = {
  anyFunctionAlias: { type: 'string' },
};

export function createValidate<Options>(properties: Properties) {
  return (options: unknown): options is Options => validateOptions(options, properties);
}

export const validateAnyAliasOptions = createValidate<AnyAliasOptions>(anyAliasProperty);

export function validateOptions(options: unknown, properties: Properties): boolean {
  if (typeof options !== 'object' || !options) {
    throw new PluginOptionsError('options must be an object');
  }
  const schema: JSONSchema7 = {
    type: 'object',
    properties,
    additionalProperties: false,
  };
  const validation = validate(options, schema);
  if (!validation.valid) {
    const message = validation.errors
      .map((error) => `${error.property}: ${error.message}`)
      .join('\n');
    throw new PluginOptionsError(message);
  }
  return true;
}
