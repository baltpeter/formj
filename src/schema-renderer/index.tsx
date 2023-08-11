import c from 'classnames';
import type { JSONSchema7, JSONSchema7Definition } from 'json-schema';
import { isMatch } from 'matcher';
import type { ComponentChildren, FunctionComponent, JSX } from 'preact';
import { objectStore } from '../store';
import { ArrayRenderer } from './array';
import { BooleanRenderer } from './boolean';
import { NullRenderer } from './null';
import { IntegerRenderer, NumberRenderer } from './numerical';
import { ObjectRenderer } from './object';
import { StringRenderer } from './string';

export type FormHelperButton = {
    pointers: string | string[];
    enabled?: boolean;
    hidden?: boolean;
    type: 'button';
    children: ComponentChildren;
    attributes: JSX.HTMLAttributes<HTMLButtonElement>;
};
export type FormHelperCustomAddon = {
    pointers: string | string[];
    enabled?: boolean;
    hidden?: boolean;
    type: 'custom-addon';
    element: ComponentChildren;
};
export type FormHelperEventHandler = {
    pointers: string | string[];
    enabled?: boolean;
    type: 'event-handler';
} & (
    | {
          event: 'onKeyDown' | 'onKeyUp';
          handler: (event: JSX.TargetedKeyboardEvent<EventTarget>) => void;
      }
    | {
          event: 'onChange' | 'onInput';
          handler: (event: JSX.TargetedEvent<EventTarget>) => void;
      }
    | {
          event: 'onFocus' | 'onBlur';
          handler: (event: JSX.TargetedFocusEvent<EventTarget>) => void;
      }
    | {
          event: 'onClick' | 'onDblClick';
          handler: (event: JSX.TargetedMouseEvent<EventTarget>) => void;
      }
);
export type FormHelperEventHandlerType = FormHelperEventHandler['event'];
export type FormHelperSuggestor = {
    pointers: string | string[];
    enabled?: boolean;
    type: 'suggestions';
    suggestions: () => unknown[];
};
export type FormHelper = (p: {
    pointer: string;
    value: unknown;
    setValue: (newValue: unknown) => void;
}) => FormHelperButton | FormHelperCustomAddon | FormHelperEventHandler | FormHelperSuggestor;

export type ValidationError = {
    pointer: string;
    message: string;
};

export type SchemaRendererProps = {
    schema: JSONSchema7Definition;
    id: string;
    pointer: string;

    required: boolean;

    errors: ValidationError[];

    helpers: FormHelper[];
};

export type SchemaTypeRendererProps = {
    schema: JSONSchema7;
    id: string;
    pointer: string;

    required: boolean;
    elementIds: {
        row: string;
        input: string;
    };

    hasError: boolean;
    errors: ValidationError[];

    helpers: FormHelper[];
    eventHandlers: Partial<Record<FormHelperEventHandlerType, (e: unknown) => void>>;
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
    if (typeof type !== 'string') throw new Error('Currently, only string types are supported.');

    const elementIds = { row: props.id, input: `${props.id}-input` };
    const value = objectStore.useTracked.getForPointer(props.pointer);

    const errors = props.errors.filter((e) => e.pointer === props.pointer);
    const helpers = props.helpers
        .map((h) =>
            h({
                pointer: props.pointer,
                value,
                setValue: (newValue: unknown) => objectStore.set.setForPointer(props.pointer, newValue),
            })
        )
        .filter((h) => h.enabled !== false)
        .filter((h) => isMatch(props.pointer, h.pointers));
    const helperButtons = helpers
        .filter((h): h is FormHelperButton | FormHelperCustomAddon => ['button', 'custom-addon'].includes(h.type))
        .map((h) =>
            h.type === 'custom-addon' ? (
                <span className="input-group-text" hidden={h.hidden}>
                    {h.element}
                </span>
            ) : (
                <button type="button" className="btn btn-outline-secondary" hidden={h.hidden} {...h.attributes}>
                    {h.children}
                </button>
            )
        );
    const eventHandlers = Object.entries(
        helpers
            .filter((h): h is FormHelperEventHandler => h.type === 'event-handler')
            .reduce<Partial<Record<FormHelperEventHandlerType, FormHelperEventHandler['handler'][]>>>((acc, h) => {
                if (acc[h.event] === undefined) acc[h.event] = [];
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                acc[h.event]!.push(h.handler);
                return acc;
            }, {})
    ).reduce<SchemaTypeRendererProps['eventHandlers']>(
        (acc, [event, handlers]) => ({
            ...acc,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            [event]: (e: any) => {
                for (const h of handlers) h(e);
            },
        }),
        {}
    );
    const suggestions = [
        ...new Set(
            helpers
                .filter((h): h is FormHelperSuggestor => h.type === 'suggestions')
                .flatMap((h) => h.suggestions())
                .filter((s) => s !== undefined && s !== value)
        ),
    ];

    if (type in schemaTypeRenderers) {
        const SchemaTypeRenderer = schemaTypeRenderers[type];
        const schemaTypeRenderer = (
            <SchemaTypeRenderer
                schema={schema}
                id={props.id}
                pointer={props.pointer}
                elementIds={elementIds}
                required={props.required}
                hasError={errors.length > 0}
                errors={props.errors}
                helpers={props.helpers}
                eventHandlers={eventHandlers}
            />
        );
        const input = (
            <>
                {helperButtons.length > 0 ? (
                    ['object', 'array'].includes(type) ? (
                        <>
                            {schemaTypeRenderer}

                            <div className={c('btn-group', 'btn-group-sm', { 'mb-3': type === 'object' })} role="group">
                                {helperButtons}
                            </div>
                        </>
                    ) : (
                        <div className="input-group input-group-sm">
                            {schemaTypeRenderer}
                            {helperButtons}
                        </div>
                    )
                ) : (
                    schemaTypeRenderer
                )}

                {errors.map((error) => (
                    <div className="invalid-feedback">{error.message}</div>
                ))}
                {suggestions.length > 0 && (
                    <div className="form-text">
                        Suggestions:{' '}
                        {suggestions.map((s, i) => (
                            <>
                                <button
                                    className="btn btn-sm btn-link"
                                    style="--bs-btn-padding-y: 0; --bs-btn-padding-x: 0;"
                                    title={`Apply suggestion: ${typeof s === 'string' ? s : JSON.stringify(s)}`}
                                    onClick={() => objectStore.set.setForPointer(props.pointer, s)}>
                                    <span className="formj-suggestion">
                                        {typeof s === 'string' ? s : JSON.stringify(s)}
                                    </span>
                                </button>
                                {i < suggestions.length - 1 && ', '}
                            </>
                        ))}
                    </div>
                )}
            </>
        );

        if (schema.title && props.pointer !== '')
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
