import c from 'classnames';
import { objectStore } from '../store';
import { emptyDefaultForJsonSchema, swapElements } from '../util';
import type { SchemaTypeRendererProps } from './index';
import { SchemaRenderer } from './index';

export const ArrayRenderer = ({ schema, elementIds, ...props }: SchemaTypeRendererProps) => {
    const items = schema.items;

    if (!items) throw new Error('Array schema must have items.');
    if (Array.isArray(items)) throw new Error('Currently, only array with object items are supported.');
    if (typeof items === 'boolean') return <></>;

    const value = (objectStore.useTracked.getForPath(props.path) as unknown[]) || [];

    const buttons = ({ index, clazz }: { index: number; clazz: string }) => (
        <>
            <button
                className={clazz}
                type="button"
                title="Delete this item"
                onClick={() =>
                    objectStore.set.setForPath(
                        props.path,
                        value.filter((_, i) => i !== index)
                    )
                }>
                <i className="bi-trash" />
            </button>
            <button
                className={clazz}
                type="button"
                title="Move this item up"
                disabled={index === 0}
                onClick={() => objectStore.set.setForPath(props.path, swapElements(value, index, index - 1))}>
                <i className="bi-arrow-up" />
            </button>
            <button
                className={clazz}
                type="button"
                title="Move this item down"
                disabled={index === value.length - 1}
                onClick={() => objectStore.set.setForPath(props.path, swapElements(value, index, index + 1))}>
                <i className="bi-arrow-down" />
            </button>
        </>
    );

    return (
        <>
            {value.map((_, index) =>
                ['object', 'array'].includes(items.type as string) || items.format === 'text' ? (
                    <>
                        <div className="row mb-3">
                            <div className="col-sm-1">
                                <div className="btn-group-vertical" role="group" aria-label="Vertical button group">
                                    {buttons({ index, clazz: 'btn btn-sm btn-outline-secondary' })}
                                </div>
                            </div>
                            <div className="col-sm">
                                <SchemaRenderer
                                    id={`${props.id}-${index}`}
                                    path={`${props.path}.${index}`}
                                    schema={items}
                                    // TODO: I don't think this is correct, but I don't see what the correct behavior
                                    // should be, either.
                                    required={false}
                                    errors={props.errors}
                                    helpers={props.helpers}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div
                        className="input-group input-group-sm mb-3"
                        // This is an ugly workaround. If a array element has helper buttons, we are wrapping it in two
                        // `input-group`s (and I can't think of a clean way not to). This causes them to still render
                        // correctly.
                        style="flex-wrap: unset;">
                        {buttons({ index, clazz: 'btn btn-outline-secondary' })}
                        <SchemaRenderer
                            id={`${props.id}-${index}`}
                            path={`${props.path}.${index}`}
                            schema={items}
                            // TODO: See above.
                            required={false}
                            errors={props.errors}
                            helpers={props.helpers}
                        />
                    </div>
                )
            )}

            <button
                type="button"
                className={c('btn', 'btn-sm', 'me-2', {
                    'is-invalid': props.hasError,
                    'btn-primary': !props.hasError,
                    'btn-danger': props.hasError,
                })}
                onClick={() => objectStore.set.setForPath(props.path, [...value, emptyDefaultForJsonSchema(items)])}>
                Add item
            </button>
        </>
    );
};
