import { objectStore } from '../store';
import { swapElements } from '../util';
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
                class={clazz}
                type="button"
                title="Delete this item"
                onClick={() =>
                    objectStore.set.setForPath(
                        props.path,
                        value.filter((_, i) => i !== index)
                    )
                }>
                <i class="bi-trash"></i>
            </button>
            <button
                class={clazz}
                type="button"
                title="Move this item up"
                disabled={index === 0}
                onClick={() => objectStore.set.setForPath(props.path, swapElements(value, index, index - 1))}>
                <i class="bi-arrow-up"></i>
            </button>
            <button
                class={clazz}
                type="button"
                title="Move this item down"
                disabled={index === value.length - 1}
                onClick={() => objectStore.set.setForPath(props.path, swapElements(value, index, index + 1))}>
                <i class="bi-arrow-down"></i>
            </button>
        </>
    );

    return (
        <>
            {value.map((_, index) =>
                ['object', 'array'].includes(items.type as string) ? (
                    <>
                        <div class="row">
                            <div class="col-sm-1">
                                <div class="btn-group-vertical" role="group" aria-label="Vertical button group">
                                    {buttons({ index, clazz: 'btn btn-sm btn-outline-secondary' })}
                                </div>
                            </div>
                            <div class="col-sm">
                                <SchemaRenderer
                                    id={`${props.id}-${index}`}
                                    path={`${props.path}.${index}`}
                                    schema={items}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <div class="input-group input-group-sm mb-3">
                        {buttons({ index, clazz: 'btn btn-outline-secondary' })}
                        <SchemaRenderer id={`${props.id}-${index}`} path={`${props.path}.${index}`} schema={items} />
                    </div>
                )
            )}

            <button
                type="button"
                class="btn btn-primary btn-sm"
                onClick={() => objectStore.set.setForPath(props.path, [...value, null])}>
                Add item
            </button>
        </>
    );
};
