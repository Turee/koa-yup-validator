# koa-yup-validator [![CircleCI](https://circleci.com/gh/Turee/koa-yup-validator.svg?style=svg)](https://circleci.com/gh/Turee/koa-yup-validator)

Koa middleware for validating and coercing request data.

## Usage

`yarn install yup koa-yup-validator`

```javascript
require("koa-yup-validator")(schema /*yup schema*/, options /* see below */);
```

Options

|              |                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| partial      | Allows data to satisfy schema partially at root level (if the data key exists it must satisfy schema). Useful for example patch operations. |
| path         | Context path to validate                                                                                                                    |
| yup          | Options to be passed to yup validate.                                                                                                       |
| errorHandler | Provide custom error handler.                                                                                                               |

Validate body

```javascript
const yup = require("yup");
const validator = require("koa-yup-validator");

const schema = yup.object().shape({
  name: yup.string().required(),
  toppings: yup.array().of(yup.string())
});

router.post("/pizza", validator(schema), ctx => {
  ctx.response.status = 200;
  ctx.response.body = "Valid pizza!";
});
```

Validate anything within context

```javascript
const yup = require("yup");
const validator = require("koa-yup-validator");

const schema = yup.object().shape({
  Authorization: yup.string().required()
});
//Validates headers
router.post("/pizza", validator(schema, { path: "request.headers" }), ctx => {
  ctx.response.status = 200;
  ctx.response.body = "Valid pizza!";
});
```
