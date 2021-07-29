import Koa from "koa";
import {
  RequestValidationError,
  ValidatedState,
  Validator,
  ValidatorOptions,
} from "./types";
import { validate } from "./validate";
import { BaseSchema, ValidationError } from "yup";

const defaultOptions: ValidatorOptions = {
  headers: {
    yup: {
      stripUnknown: false,
    },
  },
};

export function createValidationMiddleware<
  TBody extends BaseSchema,
  TQuery extends BaseSchema,
  TParams extends BaseSchema,
  THead extends BaseSchema
>(
  validators: Partial<Validator<TBody, TQuery, TParams, THead>>,
  options: ValidatorOptions = defaultOptions
): Koa.Middleware<ValidatedState<TBody, TQuery, TParams, THead>> {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const results: any = {};
    const validationErrors: any = {};
    for (const k of Object.keys(validators)) {
      try {
        results[k] = await validate(
          (validators as any)[k],
          (options as any)[k],
          (ctx.request as any)[k]
        );
      } catch (e) {
        if (e instanceof ValidationError) {
          validationErrors[k] = e;
        } else {
          throw e;
        }
      }
    }
    if (Object.keys(validationErrors).length > 0) {
      throw new RequestValidationError(
        "Request validation failed",
        validationErrors
      );
    }
    Object.assign(ctx.request, results);
    ctx.state.validated = results;
    return next();
  };
}
