import hash from 'hash-it';
import type { JSONSchema7Definition } from 'json-schema';
import { SchemaRenderer } from './schema-renderer';
import { objectStore } from './store';

export type FormProps = {
    id?: string;
    schema: JSONSchema7Definition;

    onChange?: (object: unknown, oldObject: unknown) => void;
};

export const Form = ({ schema, ...props }: FormProps) => {
    const rootId = props.id || `formj-${hash(schema)}`;

    if (props.onChange)
        objectStore.useStore.subscribe((state, prevState) => props.onChange?.(state.object, prevState.object));

    return (
        <form id={rootId}>
            <SchemaRenderer schema={schema} id={rootId} path="$" />
        </form>
    );
};
