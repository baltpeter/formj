import type { JSX } from 'preact';
import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

export const StringRenderer = ({ path, elementIds, schema, required }: SchemaTypeRendererProps) => {
    const commonProps = {
        pattern: schema.pattern,
        required,
        class: 'form-control form-control-sm',
        id: elementIds.input,
        value: objectStore.useTracked.getForPath(path),
        onChange: (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            objectStore.set.setForPath(path, e.currentTarget.value),
    };

    return schema.enum ? (
        <select
            {...commonProps}
            class="form-select form-select-sm"
            onChange={(e) =>
                objectStore.set.setForPath(
                    path,
                    e.currentTarget.value === 'undefined' ? undefined : e.currentTarget.value
                )
            }>
            {[
                ...(!required || objectStore.useTracked.getForPath(path) === undefined ? ['undefined'] : []),
                ...schema.enum,
            ].map((v) => (
                <option value={v as number}>{v === 'undefined' ? '' : v}</option>
            ))}
        </select>
    ) : schema.format === 'text' ? (
        <textarea {...commonProps} rows={5} />
    ) : (
        <input {...commonProps} type="text" />
    );
};
