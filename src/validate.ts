import * as yup from "yup";
import isEmpty from "lodash.isempty";
import { ValidationOptions } from "./types";

const VALIDATE_CONFIG = { stripUnknown: true, abortEarly: false };
const defaultValidationOptions = { partial: false };

const reachSchema = (schema: yup.AnySchema, path: string) => {
  try {
    return yup.reach(schema, path, undefined, undefined);
  } catch (e) {
    return false;
  }
};

export async function partialValidate<TSchema extends yup.SchemaOf<any>>(
  schema: TSchema,
  data: any,
  options: ValidationOptions = defaultValidationOptions
) {
  //IF data is empty validate using entire schema
  if (isEmpty(data)) {
    return schema.validate(data);
  }

  const keys = Object.keys(data);
  const result = {};
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const validationSchema = reachSchema(schema, k);
    if (validationSchema && data[k]) {
      Object.assign(
        result,
        await yup
          .object()
          .shape({
            [k]: validationSchema,
          })
          .validate({ [k]: data[k] }, { ...VALIDATE_CONFIG, ...options.yup })
      );
    }
  }
  return result;
}

export async function validate<TSchema extends yup.SchemaOf<any>>(
  schema: TSchema,
  config: ValidationOptions = defaultValidationOptions,
  data: any
) {
  const { partial } = config;
  if (partial) {
    return partialValidate(schema, data, config);
  } else {
    return schema.validate(data, { ...VALIDATE_CONFIG, ...config.yup });
  }
}
