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
```

From this point on, treat `openai` as if it's the official Open AI client. The proxy should handle routing calls to the correct endpoints.

To access the OpenAI client directly, use `nextClient` to do that:

```javascript
const nextClient = openai.nextClient();
```
Each time `nextClient` is called, the next client in the pool is retrieved.