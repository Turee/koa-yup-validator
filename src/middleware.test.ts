import Koa from "koa";
import bodyParser from "koa-bodyparser";
import Router from "koa-router";
import { createValidationMiddleware } from "./middleware";
import * as yup from "yup";
import supertest from "supertest";
import { RequestValidationError } from "./types";
import objectContaining = jasmine.objectContaining;
import { ValidationError } from "yup";

describe("middleware", () => {
  describe("when using with koa", () => {
    const app = new Koa();

    const nameSchema = yup.object().shape({
      name: yup.string().required(),
    });

    const numberSchema = yup.object().shape({
      number: yup.number().required(),
    });

    const router = new Router();
    router.get(
      "/hello",
      createValidationMiddleware({
        query: nameSchema,
      }),
      ({ request, response }) => {
        response.body = { message: `Hello, ${request.query.name}` };
        response.status = 200;
      }
    );

    router.post(
      "/hello",
      createValidationMiddleware({
        body: nameSchema,
      }),
      ({ request, response }) => {
        response.body = { count: request.body.ingredients };
      }
    );

    router.post(
      "/all/:number",
      createValidationMiddleware({
        params: numberSchema,
        body: nameSchema,
        headers: nameSchema,
        query: nameSchema,
      }),
      ({ request, response }) => {
        response.body = {
          body: request.body,
          headers: request.headers,
          query: request.query,
          params: request.params,
        };
      }
    );

    router.post(
      "/strict/:number",
      createValidationMiddleware(
        {
          body: nameSchema,
        },
        {
          body: {
            yup: {
              strict: true,
            },
          },
        }
      ),
      (ctx) => {
        ctx.response.body = { body: ctx.request.body, params: ctx.body.params };
      }
    );

    let error: any = null;
    const mockErrorMiddleware = async (ctx: Koa.Context, next: Koa.Next) => {
      try {
        return await next();
      } catch (e) {
        ctx.status = 400;
        error = e;
      }
    };
    beforeEach(() => {
      error = null;
    });

    app.use(bodyParser());
    app.use(mockErrorMiddleware);
    app.use(router.routes());

    const target = supertest(app.callback());

    describe("when called with valid query params", () => {
      it("calls the handler", async () => {
        const response = await target.get("/hello").query({ name: "Jens" });
        expect(response.status).toEqual(200);
        expect(response.body).toEqual({ message: "Hello, Jens" });
        expect(error).toBeNull();
      });
    });
    describe("when called with invalid query params", () => {
      it("throws ValidationError", async () => {
        const response = await target.get("/hello").query({ eman: "Jens" });
        expect(response.status).toEqual(400);
        expect(error).toBeInstanceOf(RequestValidationError);
        expect(error.validationErrors.query).toBeInstanceOf(ValidationError);
      });
    });
    describe("when using all validators", () => {
      it("calls the handler with values", async () => {
        const response = await target
          .post("/all/19")
          .query({ name: "query" })
          .send({ name: "body" })
          .set("name", "header");
        expect(response.status).toEqual(200);
        expect(error).toBeNull();
        expect(response.body).toEqual({
          body: {
            name: "body",
          },
          headers: expect.objectContaining({
            name: "header",
            "content-type": "application/json",
          }),
          params: {
            number: 19,
          },
          query: {
            name: "query",
          },
        });
      });
    });
    describe("when passing specific options", () => {
      const options = {
        body: {
          strict: true,
        },
      };
      it("enables strict mode for body", async () => {
        const response = await target.post("/strict/19").send({ name: 15 });
        expect(response.status).toEqual(400);
        expect(error).toBeInstanceOf(RequestValidationError);
      });
    });
  });
});
