import * as yup from "yup";
import { validate } from "./validate";
import { ValidationError } from "yup";

describe("validate", () => {
  const schema = yup.object().shape({
    a: yup.string().required(),
    b: yup.number(),
  });
  const value = {
    a: "a string",
    b: "1",
  };
  describe("when called with valid value", () => {
    const options = { partial: false };
    const result = validate(schema, options, value);
    it("returns the validated result", async () => {
      await expect(result).resolves.toEqual({ ...value, b: 1 });
    });
  });
  describe("when yup strict mode is passed", () => {
    const options = { partial: false, yup: { strict: true } };
    const result = validate(schema, options, value);
    it("does not allow coercion", async () => {
      await expect(result).rejects.toBeInstanceOf(ValidationError);
    });
  });
  describe("when partial validate is true", () => {
    const options = { partial: true };
    describe("and value has missing keys", () => {
      const value = { b: 1 };
      it("allows missing keys", async () => {
        const result = validate(schema, options, value);
        await expect(result).resolves.toEqual(value);
      });
    });
    describe("and value has invalid keys", () => {
      const value = { b: "not a number" };
      const result = validate(schema, options, value);
      it("rejects with ValidationError", async () => {
        await expect(result).rejects.toBeInstanceOf(ValidationError);
      });
    });
    describe("and value is empty", () => {
      const value = {};
      const result = validate(schema, options, value);
      it("rejects with ValidationError", async () => {
        await expect(result).rejects.toBeInstanceOf(ValidationError);
      });
    });
    describe("and value has extra keys", () => {
      const value = { c: 3, b: 2 };
      it("extra keys are ignored", async () => {
        const result = validate(schema, options, value);
        await expect(result).resolves.toEqual({ b: 2 });
      });
    });
  });
});
