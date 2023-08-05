import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import type { FunctionComponent } from 'preact';
import { ArrayRenderer } from './array';
import { BooleanRenderer } from './boolean';
import { NullRenderer } from './null';
import { IntegerRenderer, NumberRenderer } from './numerical';
import { ObjectRenderer } from './object';
import { StringRenderer } from './string';

export type SchemaRendererProps = {
    schema: JSONSchema7Definition;
    id: string;
    path: string;

    required: boolean;

    errors: { path: string; message: string }[];
};

export type SchemaTypeRendererProps = {
    schema: JSONSchema7;
    id: string;
    path: string;

    required: boolean;
    elementIds: {
        row: string;
        input: string;
    };

    hasError: boolean;
    errors: { path: string; message: string }[];
};

const schemaTypeRenderers = {
    object: ObjectRenderer,
    array: ArrayRenderer,

    string: StringRenderer,
    number: NumberRenderer,
    integer: IntegerRenderer,
    boolean: BooleanRenderer,
    null: NullRenderer,
} satisfies Record<string, FunctionComponent<SchemaTypeRendererProps>>;

export const SchemaRenderer = ({ schema, ...props }: SchemaRendererProps) => {
    if (typeof schema === 'boolean') return <></>;

    const type = schema.type;
    const elementIds = { row: props.id, input: `${props.id}-input` };

    const error = props.errors.find((e) => e.path === props.path);

    if (typeof type !== 'string') throw new Error('Currently, only string types are supported.');

    if (type in schemaTypeRenderers) {
        const SchemaTypeRenderer = schemaTypeRenderers[type];
        const input = (
            <>
                <SchemaTypeRenderer
                    schema={schema}
                    id={props.id}
                    path={props.path}
                    elementIds={elementIds}
                    required={props.required}
                    hasError={!!error}
                    errors={props.errors}
                />
                {error && <div className="invalid-feedback">{error.message}</div>}
            </>
        );

        if (schema.title && props.path !== '$')
            return (
                <div id={elementIds.row} className="row mb-3">
                    <label for={elementIds.input} className="col-sm-3 col-form-label col-form-label-sm">
                        {schema.title}
                        {props.required && (
                            <span className="text-danger" title="required">
                                {' '}
                                *
                            </span>
                        )}
                        {schema.description && (
                            <i className="bi bi-info-circle" style="margin-left: 5px;" title={schema.description} />
                        )}
                    </label>
                    <div className="col-sm">{input}</div>
                </div>
            );
        return input;
    }

    throw new Error(`Unsupported schema type: ${schema.type}`);
};
