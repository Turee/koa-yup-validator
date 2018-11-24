const yup = require("yup");
const mkValidator = require("../src");
const _ = require("lodash");

describe("Smoke tests", async () => {
  test("Modifies context with path and calls next", async () => {
    const ctx: any = {
      request: {
        body: {
          v1: 1,
          v2: 2
        }
      }
    };
    const next = jest.fn(async () => {});
    const schema = yup.object().shape({
      v1: yup.string().required()
    });

    const validator = mkValidator(schema);
    await validator(ctx, next);
    expect(ctx).toEqual({ request: { body: { v1: "1" } } });
    expect(next).toBeCalled();
  });

  test("Gives error with invalid data", async () => {
    const ctx: any = {
      request: {
        body: {
          v1: "not a number"
        }
      }
    };
    const validator = mkValidator(
      yup.object().shape({ v1: yup.number().required() })
    );
    await validator(ctx, () => {});
    expect(ctx.response.status).toEqual(400);
    expect(ctx.response.body).toEqual(
      expect.objectContaining({
        name: expect.stringMatching("ValidationError")
      })
    );
  });
});

describe("Partial validation tests", () => {
  const validCtx: any = {
    request: {
      headers: {
        v1: "test"
      }
    }
  };

  const invalidCtx: any = {
    v1: "test",
    v2: "should be object"
  };

  const schema = yup.object().shape({
    v1: yup.string().required(),
    v2: yup.object().shape({
      key: yup.string().required()
    })
  });

  test("Partial validation on valid context", async () => {
    const validator = mkValidator(schema, {
      partial: true,
      path: "request.headers"
    });
    const ctx = _.cloneDeep(validCtx);
    const next = jest.fn(async () => {});

    await validator(ctx, next);
    expect(next).toBeCalled();
    expect(ctx).toEqual(validCtx);
  });

  test("Partial validation on invalid context", async () => {
    const validator = mkValidator(schema, {
      partial: true,
      path: "request.headers"
    });
    const ctx = _.cloneDeep(invalidCtx);
    const next = jest.fn(async () => {});

    await validator(ctx, next);
    expect(next).not.toBeCalled();
    expect(ctx.response.status).toEqual(400);
    expect(ctx.response.body).toEqual(
      expect.objectContaining({
        name: expect.stringMatching("ValidationError")
      })
    );
  });
});
