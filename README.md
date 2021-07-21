# koa-yup-validator [![CircleCI](https://circleci.com/gh/Turee/koa-yup-validator.svg?style=svg)](https://circleci.com/gh/Turee/koa-yup-validator) [![Greenkeeper badge](https://badges.greenkeeper.io/Turee/koa-yup-validator.svg)](https://greenkeeper.io/)

Koa middleware for validating and coercing request data.

## Usage

`yarn add yup koa-yup-validator`

```javascript
import createValidator from "koa-yup-validator";
const validator = createValidator(validators, options); /* see below */
```

Arguments

**validators**

```typescript
{
  body: schema; // validates request body
  headers: schema; // validates request headers
  params: schema; // validates path params
  query: schema; // validates query params
}
```

**options**:

Specify options for each validator ie.

```
{
  body: options
}
```

|         |                                                                                                                                             |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| partial | Allows data to satisfy schema partially at root level (if the data key exists it must satisfy schema). Useful for example patch operations. |
| yup     | Options to be passed to yup validate.                                                                                                       |

### Error handling

There is an optional error middleware you may use for handling errors thrown by the validation middleware:

```typescript
import { createErrorMiddleware } from "koa-yup-validator";
app.use(createErrorMiddleware());
//...your routes
```

## Examples

Validate headers and body

```typescript
import * as yup from "yup";
import validator from "koa-yup-validator";

const Pizza = yup.object().shape({
  name: yup.string().required(),
  toppings: yup.array().of(yup.string()),
});
const RequiredHeaders = yup.object().shape({
  Authorization: yup.string().required(),
  "x-pizza-maker": yup.string(),
});

router.post(
  "/pizza",
  validator({ body: Pizza, headers: RequiredHeaders }),
  (ctx) => {
    console.log(ctx.request.headers["x-pizza-maker"]);
    ctx.response.status = 200;
    ctx.response.body = "Valid pizza!";
  }
);

// Pass yup options for body
router.post(
  "/strict-pizza",
  validator(
    { body: Pizza, headers: RequiredHeaders },
    { body: { yup: { strict: true } } }
  ),
  (ctx) => {
    console.log(ctx.request.headers["x-pizza-maker"]);
    ctx.response.status = 200;
    ctx.response.body = "Valid pizza!";
  }
);
```
