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
    /**
     * The path(s) to the fields that should get the helper in our format, e.g. `$.foo.1.bar`. These can include `*` as
     * wildcards.
     */
    paths: string | string[];
    enabled?: boolean;
    hidden?: boolean;
    type: 'button';
    children: ComponentChildren;
    attributes: JSX.HTMLAttributes<HTMLButtonElement>;
};
export type FormHelperCustomAddon = {
    paths: string | string[];
    enabled?: boolean;
    hidden?: boolean;
    type: 'custom-addon';
    element: ComponentChildren;
};
export type FormHelperEventHandler = {
    paths: string | string[];
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
export type FormHelper = (p: {
    path: string;
    value: unknown;
    setValue: (newValue: unknown) => void;
}) => FormHelperButton | FormHelperCustomAddon | FormHelperEventHandler;

export type ValidationError = {
    /** The path to the erroring field in our format, e.g. `$.foo.1.bar`. */
    path: string;
    message: string;
};

export type SchemaRendererProps = {
    schema: JSONSchema7Definition;
    id: string;
    path: string;

    required: boolean;

    errors: ValidationError[];

    helpers: FormHelper[];
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

    const errors = props.errors.filter((e) => e.path === props.path);
    const helpers = props.helpers.map((h) =>
        h({
            path: props.path,
            value: objectStore.useTracked.getForPath(props.path),
            setValue: (newValue: unknown) => objectStore.set.setForPath(props.path, newValue),
        })
    );
    const helperButtons = helpers
        .filter((h): h is FormHelperButton | FormHelperCustomAddon => ['button', 'custom-addon'].includes(h.type))
        .filter((h) => h.enabled !== false)
        .filter((h) => isMatch(props.path, h.paths))
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
            .filter((h) => h.enabled !== false)
            .filter((h) => isMatch(props.path, h.paths))
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

    if (type in schemaTypeRenderers) {
        const SchemaTypeRenderer = schemaTypeRenderers[type];
        const schemaTypeRenderer = (
            <SchemaTypeRenderer
                schema={schema}
                id={props.id}
                path={props.path}
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
