# koa-yup-validator [![CircleCI](https://circleci.com/gh/Turee/koa-yup-validator.svg?style=svg)](https://circleci.com/gh/Turee/koa-yup-validator) [![Greenkeeper badge](https://badges.greenkeeper.io/Turee/koa-yup-validator.svg)](https://greenkeeper.io/)

Koa middleware for validating and coercing request data.

## Usage

`yarn install yup koa-yup-validator`

```javascript
import createValidator from "koa-yup-validator";
const validator = (schema /*yup schema*/, options) /* see below */;
```

Options

|              |                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| partial      | Allows data to satisfy schema partially at root level (if the data key exists it must satisfy schema). Useful for example patch operations. |
| path         | Context path to validate                                                                                                                    |
| yup          | Options to be passed to yup validate.                                                                                                       |
| errorHandler | Provide custom error handler.                                                                                                               |

Validate body

```typescript
import * as yup from "yup";
import validator from "koa-yup-validator";

const schema = yup.object().shape({
  name: yup.string().required(),
  toppings: yup.array().of(yup.string()),
});

router.post("/pizza", validator(schema), (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = "Valid pizza!";
});
```

Validate anything within context

```typescript
import * as yup from "yup";
import validator from "koa-yup-validator";

const schema = yup.object().shape({
  Authorization: yup.string().required(),
});
//Validates headers
router.post("/pizza", validator(schema, { path: "request.headers" }), (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = "Valid pizza!";
});
```
