import type { SchemaTypeRendererProps } from './index';
import { SchemaRenderer } from './index';

export const ObjectRenderer = ({ schema, ...props }: SchemaTypeRendererProps) => {
    if (!schema.properties) throw new Error('Object schema must have properties.');

    return (
        <>
            {Object.entries(schema.properties).map(([id, subschema]) => (
                <SchemaRenderer
                    id={`${props.id}-${id}`}
                    pointer={`${props.pointer}/${id}`}
                    storeId={props.storeId}
                    schema={subschema}
                    required={!!schema.required?.includes(id)}
                    pointersToHide={props.pointersToHide}
                    errors={props.errors}
                    helpers={props.helpers}
                />
            ))}
        </>
    );
};
