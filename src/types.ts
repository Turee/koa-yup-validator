import { TypedSchema } from "yup/es/util/types";
import * as yup from "yup";
import { ValidateOptions } from "yup/lib/types";

export type Validator<
  TBody extends TypedSchema,
  TQuery extends TypedSchema,
  TParams extends TypedSchema,
  THead extends TypedSchema
> = {
  body: TBody;
  headers: THead;
  query: TQuery;
  params: TParams;
};

export type ValidatedProperties<
  TBody extends TypedSchema,
  TQuery extends TypedSchema,
  TParams extends TypedSchema,
  THead extends TypedSchema
> = {
  [k in keyof Validator<TBody, TQuery, TParams, THead>]: yup.Asserts<
    Validator<TBody, TQuery, TParams, THead>[k]
  >;
};

export type ValidatedContext<
  TBody extends TypedSchema,
  TQuery extends TypedSchema,
  TParams extends TypedSchema,
  THead extends TypedSchema
> = { request: ValidatedProperties<TBody, TQuery, TParams, THead> };

export type ValidationErrors = Record<
  keyof Partial<Validator<any, any, any, any>>,
  yup.ValidationError
>;

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
