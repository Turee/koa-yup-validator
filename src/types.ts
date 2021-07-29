import * as yup from "yup";
import { ValidateOptions } from "yup/lib/types";
import Koa from "koa";
import { AnySchema, BaseSchema } from "yup";

export type Validator<TBody, TQuery, TParams, THead> = {
  body: TBody;
  headers: THead;
  query: TQuery;
  params: TParams;
};

export interface ValidatedState<
  TBody extends BaseSchema = AnySchema,
  TQuery extends BaseSchema = AnySchema,
  TParams extends BaseSchema = AnySchema,
  THead extends BaseSchema = AnySchema
> extends Koa.DefaultState {
  validated: {
    body: yup.Asserts<TBody>;
    headers: yup.Asserts<THead>;
    query: yup.Asserts<TQuery>;
    params: yup.Asserts<TParams>;
  };
}

export type ValidationErrors = {
  [K in keyof Partial<Validator<any, any, any, any>>]: yup.ValidationError;
};

export class RequestValidationError extends Error {
  constructor(message: string, validationErrors: ValidationErrors) {
    super(message);
    this.validationErrors = validationErrors;
  }

  validationErrors: ValidationErrors;
}

export interface ValidationOptions {
  partial?: boolean;
  yup?: ValidateOptions;
}

export type ValidatorOptions = {
  [k in keyof Partial<Validator<any, any, any, any>>]: ValidationOptions;
};
