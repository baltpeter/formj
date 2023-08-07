import { AggregateAjvError } from '@segment/ajv-human-errors';
import type { AjvError as _AjvError } from '@segment/ajv-human-errors/dist/cjs/aggregate-ajv-error';
import Ajv from 'ajv';
import hash from 'hash-it';
import type { JSONSchema7Definition } from 'json-schema';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { SchemaRenderer } from './schema-renderer';
import { objectStore } from './store';
import { emtpyDefaultForJsonSchema } from './util';

export type AjvError = _AjvError & {
    /** The path to the erroring field in our format, e.g. `$.foo.1.bar`. */
    path?: string;
};

export type FormSubmittedEvent = {
    event: 'submitted';
    object: unknown;
    ajvResult: boolean | AjvError[];
};
export type FormChangedEvent = {
    event: 'changed';
    object: unknown;
    oldObject: unknown;
};
export type FormApi = {
    validate: () => boolean | AjvError[];
    submit: () => void;
};
export type FormProps = {
    id?: string;
    schema: JSONSchema7Definition;

    customAjv?: Ajv;

    onSubmit?: (formData: FormSubmittedEvent) => void;
    onChange?: (formData: FormChangedEvent) => void;
    formApiRef?: { current: FormApi | null };
};

export const Form = ({ schema, ...props }: FormProps) => {
    useEffect(() => {
        objectStore.set.object(emtpyDefaultForJsonSchema(schema) as Record<string, unknown>);
    }, [schema]);

    const ajv = useMemo(() => props.customAjv || new Ajv(), [props.customAjv]);
    const ajvSchema = useMemo(() => ajv.compile(schema), [ajv, schema]);
    const [ajvSchemaErrors, setAjvSchemaErrors] = useState<AjvError[]>([]);

    const formApi: FormApi = {
        validate: () => {
            const passed = ajvSchema(objectStore.get.object());
            if (passed) return true;

            // I initially used `[...new AggregateAjvError(…)]` here but the way microbundle transpiled that broke
            // the functionality.
            const errors = Array.from(
                new AggregateAjvError(ajvSchema.errors || [], {
                    fieldLabels: 'js',
                    includeData: true,
                    includeOriginalError: true,
                })
            ).map((e) => {
                const path = e.pointer === '' ? '$' : '$.' + e.pointer.substring(1).replace(/\//g, '.');

                if (e.original?.keyword === 'required' && e.original?.params?.['missingProperty'])
                    e.path = path + '.' + e.original.params['missingProperty'];
                else e.path = path;
                return e;
            });
            setAjvSchemaErrors(errors);
            return errors;
        },
        submit: () => {
            const ajvResult = formApi.validate();
            props.onSubmit?.({ event: 'submitted', object: objectStore.get.object(), ajvResult });
        },
    };

    if (props.onChange)
        objectStore.useStore.subscribe((state, prevState) =>
            props.onChange?.({ event: 'changed', object: state.object, oldObject: prevState.object })
        );
    if (props.formApiRef) props.formApiRef.current = formApi;

    const rootId = props.id || `formj-${hash(schema)}`;
    return (
        <form id={rootId} noValidate>
            <SchemaRenderer schema={schema} id={rootId} path="$" required={false} errors={ajvSchemaErrors} />
        </form>
    );
};
