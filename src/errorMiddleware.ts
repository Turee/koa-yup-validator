import Koa from "koa";
import { RequestValidationError } from "./types";
import { ValidationError } from "yup";
import isEmpty from "lodash.isempty";

const formatYupError = (error: ValidationError) => {
  let errors = [
    {
      path: error.path,
      message: error.message,
      type: error.type,
    },
  ];
  if (!isEmpty(error.inner)) {
    for (const inner of error.inner) {
      errors = errors.concat(formatYupError(inner));
    }
  }
  return errors.filter((e) => typeof e.path === "string");
};

export const formatRequestValidationError = (error: any) => {
  const validationErrors: any = {};
  for (const key of Object.keys(error.validationErrors)) {
    validationErrors[key] = formatYupError(error.validationErrors[key]);
  }
  return {
    type: "ValidationError",
    validationErrors,
  };
};

export const createErrorMiddleware =
  () => async (ctx: Koa.Context, next: Koa.Next) => {
    try {
      return await next();
    } catch (e) {
      if (e instanceof RequestValidationError) {
        ctx.response.body = formatRequestValidationError(e);
        ctx.response.status = 400;
      } else {
        throw e;
      }
    }
  };
