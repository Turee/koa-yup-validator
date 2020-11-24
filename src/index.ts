// Schema = yup schema
import * as yup from "yup";
import get from "lodash.get";
import set from "lodash.set";
import isEmpty from "lodash.isempty";
import { Context } from "koa";

export interface ValidationConfig {
  path?: String | any[];
  partial?: boolean;
  yup?: yup.ValidateOptions;
  errorHandler?: (ctx: Context, error: any) => any;
}

const defaultErrorHandler = (ctx: Context, error: any) => {
  if (get(error, "name") === "ValidationError") {
    set(ctx, "response.status", 400);
    set(ctx, "response.body", error);
  } else {
    throw error;
  }
};

const defaultConfig = {
  path: "request.body",
  partial: false, //Allows body to satisfy schema partially at root level
  errorHandler: defaultErrorHandler,
};

const VALIDATE_CONFIG = { stripUnknown: true, abortEarly: false };

const reachSchema = (schema, path) => {
  try {
    return yup.reach(schema, path);
  } catch (e) {
    return false;
  }
};

const partialValidate = async (schema, data, { yup: yupConfig = {} }) => {
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
          .validate({ [k]: data[k] }, { ...VALIDATE_CONFIG, ...yupConfig })
      );
    }
  }
  return result;
};

const validate = (schema, config: ValidationConfig, ctx) => {
  const { partial, path } = config;
  const data = get(ctx, path);
  if (partial) {
    return partialValidate(schema, data, config);
  } else {
    return schema.validate(data, { ...VALIDATE_CONFIG, ...config.yup });
  }
};

const validateConfig = ({ path }: ValidationConfig) => {
  if (isEmpty(path)) {
    throw new Error("Path must not be empty");
  }
};

export default function validator<T>(
  schema: yup.Schema<T>,
  config: ValidationConfig = defaultConfig
) {
  validateConfig(config);
  return async (ctx: Context, next: any) => {
    const mergedConfig = { ...defaultConfig, ...config };
    const { path, errorHandler } = mergedConfig;

    return validate(schema, mergedConfig, ctx)
      .then(async (data) => {
        set(ctx, path, data);
        await next();
      })
      .catch((error) => {
        return errorHandler(ctx, error);
      });
  };
}
