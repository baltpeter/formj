import type { SchemaTypeRendererProps } from './index';
import { SchemaRenderer } from './index';

export const ObjectRenderer = ({ schema, ...props }: SchemaTypeRendererProps) => {
    if (!schema.properties) throw new Error('Object schema must have properties.');

    return (
        <>
            {Object.entries(schema.properties).map(([id, subschema]) => (
                <SchemaRenderer
                    id={`${props.id}-${id}`}
                    path={`${props.path}.${id}`}
                    schema={subschema}
                    required={!!schema.required?.includes(id)}
                    errors={props.errors}
                />
            ))}
        </>
    );
};
