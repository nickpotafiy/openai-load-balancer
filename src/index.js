import OpenAI from "openai";

class BalancerClient {

    constructor({ baseURL = null, apiKey = null, model = null }) {
        this.baseURL = baseURL;
        this.apiKey = apiKey;
        this.model = model;
        this.openai = new OpenAI({
            apiKey: this.apiKey,
            baseURL: this.baseURL,
        });
    }

}

class UniversalProxy {

    constructor(target, client = null) {
        this.target = target;
        this.client = client;
        return new Proxy(this, {
            get: (proxy, property, receiver) => {
                if (proxy.target instanceof OpenAIBalancer) {
                    if (property === 'nextClient') {
                        return () => {
                            const nextClient = proxy.target.nextClient.bind(proxy.target)();
                            if (nextClient && nextClient.openai) {
                                return nextClient.openai;
                            }
                            return null;
                        };
                    }
                    const currentClient = proxy.target.nextClient();
                    return new UniversalProxy(currentClient.openai, currentClient)[property];
                }
                const prop = proxy.target[property];
                // Handling function calls
                if (typeof prop === 'function') {
                    return async (...args) => {
                        if (args && args.length > 0 && typeof args[0] === 'object' && args[0].model === 'auto') {
                            // If the model is set to 'auto', try picking the first model from the list
                            if (this.client && !this.client.model) {
                                try {
                                    const models = await this.client.openai.models.list();
                                    const modelId = models && models.data && Array.isArray(models.data) && models.data[0].id || null;
                                    if (modelId) {
                                        if (models.data.length > 1) {
                                            throw new Error("Multiple models found, specify the model manually");
                                        }
                                        this.client.model = modelId;
                                    } else {
                                        throw new Error("Failed fetching model list, specify the model manually");
                                    }
                                } catch (e) {
                                    throw e;
                                }
                            }
                        }
                        if (this.client && this.client.model) {
                            if(args[0] && typeof args[0] === 'object') {
                                args[0].model = this.client.model;
                            } else {
                                console.log("args[0] not defined", args, "property", property);
                            }
                        }
                        return prop.apply(proxy.target, args);
                    };
                }
                // Handling objects (nested properties)
                if (typeof prop === 'object' && prop !== null) {
                    return new UniversalProxy(prop, this.client);
                }
                // If the property is not a function or object, return it directly
                return prop;
            }
        });
    }

}

export default class OpenAIBalancer {

    constructor(config) {
        this.config = config;
        if (!config) {
            throw new Error("No configuration provided");
        }
        this.balancingStrategy = config.balancingStrategy || "round-robin";
        if (!['round-robin', 'random'].includes(this.balancingStrategy)) {
            throw new Error(`Invalid balancing strategy ${this.balancingStrategy}`);
        }

        this.clients = [];
        if (!config.endpoints || config.endpoints.length === 0) {
            throw new Error("No endpoints provided");
        }
        for (const endpoint of config.endpoints) {
            const model = endpoint.model || null;
            const baseURL = endpoint.baseURL || null;
            if (!baseURL) {
                throw new Error("No baseURL provided for endpoint");
            }
            const apiKey = endpoint.apiKey || null;
            const client = new BalancerClient({ baseURL, apiKey, model });
            this.clients.push(client);
        }
        this.currentClientIndex = -1;

        this.nextClient = () => {
            if (this.balancingStrategy === 'round-robin') {
                this.currentClientIndex = (this.currentClientIndex + 1) % this.clients.length;
                return this.clients[this.currentClientIndex];
            } else {
                // select a client randomly
                const randomIndex = Math.floor(Math.random() * this.clients.length);
                return this.clients[randomIndex];
            }
        }
        return new UniversalProxy(this);
    }

}