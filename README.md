# OpenAI Load Balancer

This is a lightweight JavaScript wrapper that provides a load balancer for OpenAI client calls.

## Installing

Install with NPM

```shell
npm install git+https://github.com/nickpotafiy/openai-load-balancer.git
```

Install with Yarn

```shell
yarn add https://github.com/nickpotafiy/openai-load-balancer.git
```

## How to Use

```javascript
import OpenAIBalancer from "openai-load-balancer";

try {
  const openai = new OpenAIBalancer({
    balancingStrategy: "round-robin", // or "random"
    endpoints: [{
      baseURL: "https://api.openai.com/v1",
      apiKey: "<OpenAI API Key>",
    }, {
      baseURL: "http://127.0.0.1:8000/v1",
      apiKey: "",
    }],
  });
} catch(e) {
  console.error(e);
}

```

From this point on, treat `openai` as if it's the official Open AI client. The proxy should handle routing calls to the correct endpoints.

To access the OpenAI client directly, use `nextClient` to do that:

```javascript
const nextClient = openai.nextClient();
```
Each time `nextClient` is called, the next client in the pool is retrieved.

## Auto Model Detection

When calling methods that require the `model` parameter (ie. `completions`, `chat,` `embeddings`, etc), you can optionally set model to `auto` to allow the load balancer to automatically select the first available model and fill that parameter for you. This is especially helpful in local setups where there's only 1 model being typically hosted on a given host/port anyway.

Example of using auto model which picks the first available model.

```javascript
const embeddings = await openai.embeddings.create({
  model: "auto",
  input: ["My Text"],
  encoding_format: "float"
});
```