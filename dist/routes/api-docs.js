"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const router = express_1.default.Router();
const getApiDocs = (req, res) => {
    try {
        const openApiPath = path_1.default.join(__dirname, "../openapi.yaml");
        const fileContents = fs_1.default.readFileSync(openApiPath, "utf8");
        let apiDoc;
        try {
            apiDoc = js_yaml_1.default.load(fileContents);
        }
        catch (yamlError) {
            if (yamlError.message.includes("duplicated mapping key")) {
                return res.status(500).json({
                    msg: "Error: OpenAPI YAML file has duplicate keys. Please fix the YAML file.",
                    error: yamlError.message,
                });
            }
            throw yamlError;
        }
        const endpoints = [];
        const paths = apiDoc.paths || {};
        for (const routePath in paths) {
            const methods = paths[routePath];
            for (const method in methods) {
                const endpoint = methods[method];
                const parameters = endpoint.parameters || [];
                const requestBody = endpoint.requestBody;
                const responses = endpoint.responses || {};
                const requestStructure = {
                    pathParameters: [],
                    queryParameters: [],
                    body: null,
                };
                parameters.forEach((param) => {
                    if (param.in === "path") {
                        requestStructure.pathParameters.push({
                            name: param.name,
                            type: param.schema.type,
                            required: param.required || false,
                            description: param.description,
                        });
                    }
                    else if (param.in === "query") {
                        requestStructure.queryParameters.push({
                            name: param.name,
                            type: param.schema.type,
                            required: param.required || false,
                            description: param.description,
                            default: param.schema.default,
                            enum: param.schema.enum,
                        });
                    }
                });
                if (requestBody && requestBody.content) {
                    const content = requestBody.content;
                    if (content["application/json"]) {
                        const schema = content["application/json"].schema;
                        requestStructure.body = {
                            contentType: "application/json",
                            required: schema.required || [],
                            properties: {},
                        };
                        if (schema.properties) {
                            for (const prop in schema.properties) {
                                const propData = schema.properties[prop];
                                requestStructure.body.properties[prop] = {
                                    type: propData.type,
                                    description: propData.description,
                                    enum: propData.enum,
                                    default: propData.default,
                                    minimum: propData.minimum,
                                    maximum: propData.maximum,
                                    format: propData.format,
                                };
                                if (propData.type === "array" && propData.items) {
                                    requestStructure.body.properties[prop].items = propData.items.type;
                                    if (propData.items.properties) {
                                        requestStructure.body.properties[prop].itemProperties = {};
                                        for (const itemProp in propData.items.properties) {
                                            requestStructure.body.properties[prop].itemProperties[itemProp] =
                                                propData.items.properties[itemProp].type;
                                        }
                                    }
                                }
                                if (propData.type === "object" && propData.properties) {
                                    requestStructure.body.properties[prop].nestedProperties = {};
                                    for (const nestedProp in propData.properties) {
                                        requestStructure.body.properties[prop].nestedProperties[nestedProp] =
                                            propData.properties[nestedProp].type;
                                    }
                                }
                            }
                        }
                    }
                    else if (content["multipart/form-data"]) {
                        const schema = content["multipart/form-data"].schema;
                        requestStructure.body = {
                            contentType: "multipart/form-data",
                            required: schema.required || [],
                            properties: {},
                        };
                        if (schema.properties) {
                            for (const prop in schema.properties) {
                                const propData = schema.properties[prop];
                                requestStructure.body.properties[prop] = {
                                    type: propData.type,
                                    format: propData.format,
                                    description: propData.description,
                                };
                            }
                        }
                    }
                }
                const responseStructure = {};
                for (const statusCode in responses) {
                    const response = responses[statusCode];
                    responseStructure[statusCode] = {
                        description: response.description,
                    };
                    if (response.content && response.content["application/json"]) {
                        const schema = response.content["application/json"].schema;
                        if (schema.properties) {
                            responseStructure[statusCode].body = {};
                            for (const prop in schema.properties) {
                                responseStructure[statusCode].body[prop] = {
                                    type: schema.properties[prop].type,
                                    description: schema.properties[prop].description,
                                    example: schema.properties[prop].example,
                                };
                                if (schema.properties[prop].$ref) {
                                    const ref = schema.properties[prop].$ref;
                                    const schemaName = ref.split("/").pop();
                                    responseStructure[statusCode].body[prop].$ref = schemaName;
                                    if (apiDoc.components && apiDoc.components.schemas && apiDoc.components.schemas[schemaName]) {
                                        const refSchema = apiDoc.components.schemas[schemaName];
                                        responseStructure[statusCode].body[prop].schemaStructure = refSchema.properties || {};
                                    }
                                }
                                if (schema.properties[prop].type === "array" && schema.properties[prop].items) {
                                    responseStructure[statusCode].body[prop].items = {
                                        type: schema.properties[prop].items.type,
                                    };
                                    if (schema.properties[prop].items.$ref) {
                                        const ref = schema.properties[prop].items.$ref;
                                        const schemaName = ref.split("/").pop();
                                        responseStructure[statusCode].body[prop].items.$ref = schemaName;
                                        if (apiDoc.components && apiDoc.components.schemas && apiDoc.components.schemas[schemaName]) {
                                            const refSchema = apiDoc.components.schemas[schemaName];
                                            responseStructure[statusCode].body[prop].items.schemaStructure = refSchema.properties || {};
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                endpoints.push({
                    path: routePath,
                    method: method.toUpperCase(),
                    summary: endpoint.summary,
                    description: endpoint.description,
                    tags: endpoint.tags || [],
                    authentication: !endpoint.security || endpoint.security.length === 0 ? "none" : "Bearer JWT",
                    request: requestStructure,
                    response: responseStructure,
                });
            }
        }
        const apiStructure = {
            info: apiDoc.info,
            servers: apiDoc.servers,
            endpoints: endpoints,
            schemas: apiDoc.components ? apiDoc.components.schemas : {},
            tags: apiDoc.tags || [],
            websockets: {
                events: [
                    { name: "connection", description: "Conexión inicial" },
                    { name: "rideUpdate", description: "Actualización de estado de viaje" },
                    { name: "rideAccepted", description: "Viaje aceptado por chofer" },
                    { name: "deliveryUpdate", description: "Actualización de estado de entrega" },
                    { name: "deliveryCancelled", description: "Entrega cancelada" },
                    { name: "joinRoom", description: "Unirse a sala específica (ride_{id} o delivery_{id})" },
                    { name: "leaveRoom", description: "Salir de sala" },
                    { name: "locationUpdate", description: "Actualización de ubicación del chofer" },
                ],
            },
        };
        res.status(200).json({
            message: "API documentation retrieved successfully",
            api: apiStructure,
        });
    }
    catch (error) {
        res.status(500).json({
            msg: "Error reading API documentation",
            error: error.message,
        });
    }
};
router.get("/", getApiDocs);
exports.default = router;
//# sourceMappingURL=api-docs.js.map