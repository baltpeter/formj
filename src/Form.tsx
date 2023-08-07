import { AggregateAjvError } from '@segment/ajv-human-errors';
import Ajv from 'ajv';
import hash from 'hash-it';
import type { JSONSchema7Definition } from 'json-schema';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { SchemaRenderer, type ValidationError } from './schema-renderer';
import { objectStore } from './store';
import { emtpyDefaultForJsonSchema, jsonPointerToPath } from './util';

export type FormSubmittedEvent = {
    event: 'submitted';
    object: unknown;
    ajvResult: true | ValidationError[];
};
export type FormChangedEvent = {
    event: 'changed';
    object: unknown;
    oldObject: unknown;
};
export type FormApi = {
    validate: () => true | ValidationError[];
    submit: () => void;
};
export type FormProps = {
    id?: string;
    schema: JSONSchema7Definition;

    customAjv?: Ajv;
    customValidators?: ((obj: Record<string, unknown>) => true | ValidationError[])[];

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
    const [ajvSchemaErrors, setAjvSchemaErrors] = useState<ValidationError[]>([]);

    const formApi: FormApi = {
        validate: () => {
            const passed = ajvSchema(objectStore.get.object());
            if (passed) {
                setAjvSchemaErrors([]);
                return true;
            }

            // I initially used `[...new AggregateAjvError(…)]` here but the way microbundle transpiled that broke
            // the functionality.
            const ajvErrors = Array.from(
                new AggregateAjvError(ajvSchema.errors || [], {
                    fieldLabels: 'js',
                    includeData: true,
                    includeOriginalError: true,
                })
            ).map((e) => {
                const path = jsonPointerToPath(e.pointer);

                if (e.original?.keyword === 'required' && e.original?.params?.['missingProperty'])
                    e.path = path + '.' + e.original.params['missingProperty'];
                else e.path = path;
                return e;
            });

            const customErrors =
                props.customValidators
                    ?.map((v) => v(objectStore.get.object()))
                    .filter((r): r is ValidationError[] => r !== true)
                    .flat() || [];

            const errors = [...ajvErrors, ...customErrors];
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
