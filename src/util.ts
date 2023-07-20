import type { JSONSchema7Definition } from 'json-schema';

export const swapElements = <T>(array: T[], i: number, j: number): T[] => {
    if (i < 0 || i >= array.length || j < 0 || j >= array.length) throw new Error('Invalid index.');

    const arrayCopy = [...array];
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j] as T, arrayCopy[i] as T];
    return arrayCopy;
};

export const emtpyDefaultForJsonSchema = (schema: JSONSchema7Definition) => {
    if (typeof schema === 'boolean') return schema;

    if (schema.default !== undefined) return schema.default;

    if (schema.type === 'object') {
        const object: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(schema.properties ?? {}))
            object[key] = emtpyDefaultForJsonSchema(value);
        return object;
    }
    if (schema.type === 'null') return null;

    return undefined;
};
