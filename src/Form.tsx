import hash from 'hash-it';
import type { JSONSchema7Definition } from 'json-schema';
import { useEffect } from 'preact/hooks';
import { SchemaRenderer } from './schema-renderer';
import { objectStore } from './store';
import { emtpyDefaultForJsonSchema } from './util';

export type FormProps = {
    id?: string;
    schema: JSONSchema7Definition;

    onChange?: (object: unknown, oldObject: unknown) => void;
};

export const Form = ({ schema, ...props }: FormProps) => {
    useEffect(() => {
        objectStore.set.object(emtpyDefaultForJsonSchema(schema) as Record<string, unknown>);
    }, [schema]);

    const rootId = props.id || `formj-${hash(schema)}`;

    if (props.onChange)
        objectStore.useStore.subscribe((state, prevState) => props.onChange?.(state.object, prevState.object));

    return (
        <form id={rootId}>
            <SchemaRenderer schema={schema} id={rootId} path="$" required={false} />
        </form>
    );
};
