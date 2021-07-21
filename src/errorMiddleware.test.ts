import * as yup from "yup";
import {
  createErrorMiddleware,
  formatRequestValidationError,
} from "./errorMiddleware";
import { RequestValidationError } from "./types";
import Koa from "koa";
import Router from "koa-router";
import { createValidationMiddleware } from "./middleware";
import bodyParser from "koa-bodyparser";
import supertest from "supertest";

const getError = (schema: yup.AnySchema, value: any) => {
  try {
    schema.validateSync(value, { abortEarly: false });
  } catch (e) {
    return new RequestValidationError("validation failed", {
      body: e,
    } as any);
  }
  throw new Error("error expected");
};

describe("formatValidationError", () => {
  const simpleSchema = yup.object().shape({
    key: yup.string().required(),
  });

  const nestedSchema = yup.object().shape({
    stringKey: yup.string().required().url(),
    numberKey: yup.number().required().min(5),
    missingKey: yup.string().required(),
    nestedObject: simpleSchema,
  });

  describe.each([
    ["array schema", yup.array().of(yup.number()), ["asdf"]],
    ["number schema", yup.number(), "asdf"],
    ["nested schema", nestedSchema, { stringKey: 5, numberKey: 1 }],
    [
      "array schema with nested values",
      yup.array().of(nestedSchema),
      [{ stringKey: 5, numberKey: 1 }],
    ],
    [
      "containing array schema",
      yup
        .object()
        .shape({ arr: yup.array().of(nestedSchema).required().min(2) }),
      { arr: [{}] },
    ],
  ])("when given %s", (_, schema, value) => {
    const result = formatRequestValidationError(getError(schema, value));

    it("formats error correctly", () => {
      expect(result).toMatchSnapshot();
    });
  });
});

describe("errorMiddleware", () => {
  describe("when using the error middleware", () => {
    const app = new Koa();

    const schema = yup.object().shape({
      name: yup.string().required(),
      toppings: yup.array().of(yup.string().required()).required(),
    });

    const router = new Router();
    router.post(
      "/hello",
      createValidationMiddleware({
        body: schema,
      }),
      ({ request, response }) => {
        response.body = { count: request.body.ingredients };
      }
    );
    app.use(bodyParser());
    app.use(createErrorMiddleware());
    app.use(router.routes());

    const target = supertest(app.callback());

    describe("when called with invalid request", () => {
      const responsePromise = target.post("/hello").send({});
      it("returns 400", async () => {
        const response = await responsePromise;
        expect(response.status).toEqual(400);
      });
      it("returns formatted error", async () => {
        const response = await responsePromise;
        expect(response.body).toMatchSnapshot();
      });
    });
  });
});
