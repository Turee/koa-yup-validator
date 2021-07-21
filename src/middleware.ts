import * as yup from "yup";
import Koa, { DefaultState } from "koa";
import {
  RequestValidationError,
  ValidatedContext,
  Validator,
  ValidatorOptions,
} from "./types";
import { validate } from "./validate";
import { ValidationError } from "yup";

const defaultOptions: ValidatorOptions = {
  headers: {
    yup: {
      stripUnknown: false,
    },
  },
};

export function createValidationMiddleware<
  TBody extends yup.SchemaOf<any> = yup.AnyObjectSchema,
  TQuery extends yup.SchemaOf<any> = yup.AnyObjectSchema,
  TParams extends yup.SchemaOf<any> = yup.AnyObjectSchema,
  THead extends yup.SchemaOf<any> = yup.AnyObjectSchema
>(
  validators: Partial<Validator<TBody, TQuery, TParams, THead>>,
  options: ValidatorOptions = defaultOptions
): Koa.Middleware<
  DefaultState,
  ValidatedContext<TBody, TQuery, TParams, THead>
> {
  return async (ctx: Koa.Context, next: Koa.Next) => {
    const request = ctx.request as any;
    const validationErrors: any = {};
    for (const k of Object.keys(validators)) {
      try {
        request[k] = await validate(
          (validators as any)[k],
          (options as any)[k],
          request[k]
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
    return next();
  };
}
