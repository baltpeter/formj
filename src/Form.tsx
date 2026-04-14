import { AggregateAjvError } from '@segment/ajv-human-errors';
import Ajv from 'ajv';
import type { JSONSchema7Definition } from 'json-schema';
import { nanoid } from 'nanoid';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { SchemaRenderer, type FormHelper, type ValidationError } from './schema-renderer';
import { objectStore } from './store';
import { emptyDefaultForJsonSchema } from './util';

export type FormSubmittedEvent<ObjT> = {
    event: 'submitted';
    object: Partial<ObjT>;
    validationResult: true | ValidationError[];
};
export type FormChangedEvent<ObjT> = {
    event: 'changed';
    object: Partial<ObjT>;
    oldObject: Partial<ObjT>;
};
export type FormApi<ObjT> = {
    overrideObject: (newObj: Partial<ObjT>) => void;
    get: (pointer: string) => unknown;
    set: (pointer: string, value: unknown) => void;

    validate: () => true | ValidationError[];
    submit: () => void;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormProps<ObjT extends Record<string, any> = Record<string, unknown>> = {
    id?: string;
    schema: JSONSchema7Definition;
    initialData?: Partial<ObjT>;
    showValidationErrors?: boolean;
    autoComplete?: 'on' | 'off';
    pointersToHide?: string[];

    helpers?: FormHelper[];

    customAjv?: Ajv;
    customValidators?: ((obj: ObjT) => true | ValidationError[])[];

    onSubmit?: (formData: FormSubmittedEvent<ObjT>) => void;
    onChange?: (formData: FormChangedEvent<ObjT>) => void;
    formApiRef?: { current: FormApi<ObjT> | null };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Form = <ObjT extends Record<string, any>>({ schema, ...props }: FormProps<ObjT>) => {
    const [rootId] = useState(props.id || `formj-${nanoid()}`);

    useEffect(() => {
        const emptyObject = emptyDefaultForJsonSchema(schema) as Record<string, unknown>;

        objectStore.set.overrideObject(
            rootId,
            props.initialData !== undefined ? { ...emptyObject, ...props.initialData } : emptyObject
        );
        // We deliberately _don't_ want to update when `initialData` changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [schema]);

    const ajv = useMemo(() => props.customAjv || new Ajv(), [props.customAjv]);
    const ajvSchema = useMemo(() => ajv.compile(schema), [ajv, schema]);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

    const formApi: FormApi<ObjT> = {
        overrideObject: (newObj) => objectStore.set.overrideObject(rootId, newObj),
        get: (pointer) => objectStore.get.getForPointer(rootId, pointer),
        set: (pointer, value) => objectStore.set.setForPointer(rootId, pointer, value),

        validate: () => {
            const obj = objectStore.get.getObject(rootId);
            const ajvPassed = ajvSchema(obj);

            const customErrors =
                props.customValidators
                    ?.map((v) => v(obj as ObjT))
                    .filter((r): r is ValidationError[] => r !== true)
                    .flat() || [];

            if (ajvPassed && customErrors.length === 0) {
                setValidationErrors([]);
                return true;
            }

            const ajvErrors = [
                ...new AggregateAjvError(ajvSchema.errors || [], {
                    fieldLabels: 'js',
                    includeData: true,
                    includeOriginalError: true,
                }),
            ].map((e) => {
                if (e.original?.keyword === 'required' && e.original?.params?.['missingProperty'])
                    e.pointer += '/' + e.original.params['missingProperty'];
                return e;
            });

            const errors = [...ajvErrors, ...customErrors];
            setValidationErrors(errors);
            return errors;
        },
        submit: () => {
            const validationResult = formApi.validate();
            props.onSubmit?.({
                event: 'submitted',
                object: objectStore.get.getObject(rootId) as ObjT,
                validationResult,
            });
        },
    };

    if (props.onChange)
        objectStore.useStore.subscribe((state, prevState) =>
            props.onChange?.({
                event: 'changed',
                object: (state.objects[rootId] || {}) as ObjT,
                oldObject: (prevState.objects[rootId] || {}) as ObjT,
            })
        );
    if (props.formApiRef) props.formApiRef.current = formApi;

    return (
        <>
            <style>
                {
                    // This is an ugly workaround. If an array element has helper buttons, we are wrapping it in two
                    // `input-group`s (and I can't think of a clean way not to). This causes them to still render
                    // correctly.
                    `#${rootId} .input-group .input-group {
                        flex: auto;
                        width: 1%;
                    }`
                }
            </style>
            <form id={rootId} noValidate autoComplete={props.autoComplete} onSubmit={(e) => e.preventDefault()}>
                <SchemaRenderer
                    schema={schema}
                    id={rootId}
                    pointer=""
                    storeId={rootId}
                    required={false}
                    pointersToHide={props.pointersToHide}
                    errors={props.showValidationErrors === false ? [] : validationErrors}
                    helpers={props.helpers || []}
                />
            </form>
        </>
    );
};
