export function parseArray(key: string, json: any): any {
    const schema: any = {
        type: "array",
        items: {
            type: "",
        },
    };

    const subtype = typeof json[0];
    switch (subtype) {
        case "object":
            const subschema = parseObject(json[0]);
            if (subschema == null) {
                console.warn(`WARN: key '${key}', array has no elements`);
                break;
            }

            schema.items = subschema;
            break;
        case "string":
        case "boolean":
            {
                schema.items.type = subtype;
                break;
            }
        case "number":
            {
                if (Number.isInteger(json[0])) {
                    schema.items.type = "integer";
                    break;
                }

                schema.items.type = "float";
                break;
            }
        default:
            break;
    }

    return schema;
}

export function parseObject(json: any): unknown {
    const schema: any = {
        type: "object",
        properties: {},
    };

    if (json == null) {
        schema.type = "null";
        return schema;
    }

    const keys = Object.keys(json);
    if (keys.length == 0) {
        return null;
    }

    for (const key of keys) {
        const keyType = typeof json[key];

        if (json[key] == null) {
            continue;
        }

        switch (keyType) {
            case "string":
            case "boolean":
                {
                    schema.properties[key] = keyType;
                    break;
                }
            case "number":
                {
                    if (Number.isInteger(json[key])) {
                        schema.properties[key] = "integer";
                        break;
                    }

                    schema.properties[key] = "float";
                    break;
                }
            case "object":
                {
                    const subkeys = Object.keys(json[key]);
                    let isArray = subkeys.length > 0;
                    for (let i = 0; i < subkeys.length; i++) {
                        const subkey = Number(subkeys[i]);
                        if (subkey != i) {
                            isArray = false;
                            break;
                        }
                    }

                    if (isArray) {
                        schema.properties[key] = parseArray(key, json[key]);
                        break;
                    }

                    const subschema = parseObject(json[key]);
                    if (subschema == null) {
                        console.warn(`WARN: key '${key}' has no properties`, json);
                        break;
                    }

                    schema.properties[key] = subschema;
                    break;
                }
            default:
                {
                    console.warn("unhandled type:", keyType);
                    break;
                }
        }
    }

    return schema;
}
