import hash from 'hash-it';
import type { JSONSchema7Definition } from 'json-schema';
import { useEffect } from 'preact/hooks';
import { SchemaRenderer } from './schema-renderer';
import { objectStore } from './store';
import { emtpyDefaultForJsonSchema } from './util';

export type FormData = { object: unknown; event: 'submitted' | 'changed' };
export type FormDataWithOldData = FormData & { oldObject: unknown; event: 'changed' };
export type FormApi = {
    submit: () => void;
};
export type FormProps = {
    id?: string;
    schema: JSONSchema7Definition;

    onSubmit?: (formData: FormData) => void;
    onChange?: (formData: FormDataWithOldData) => void;
    formApiRef?: { current: FormApi | null };
};

export const Form = ({ schema, ...props }: FormProps) => {
    useEffect(() => {
        objectStore.set.object(emtpyDefaultForJsonSchema(schema) as Record<string, unknown>);
    }, [schema]);

    const formApi: FormApi = {
        submit: () => props.onSubmit?.({ object: objectStore.useStore.getState().object, event: 'submitted' }),
    };

    if (props.onChange)
        objectStore.useStore.subscribe((state, prevState) =>
            props.onChange?.({ object: state.object, oldObject: prevState.object, event: 'changed' })
        );

    if (props.formApiRef) props.formApiRef.current = formApi;

    const rootId = props.id || `formj-${hash(schema)}`;
    return (
        <form id={rootId}>
            <SchemaRenderer schema={schema} id={rootId} path="$" required={false} />
        </form>
    );
};
