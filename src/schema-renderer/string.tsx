import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

export const StringRenderer = ({ path, elementIds, schema, required }: SchemaTypeRendererProps) =>
    schema.enum ? (
        <select
            class="form-select form-select-sm"
            id={elementIds.input}
            required={required}
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
                <option value={v as number} selected={objectStore.useTracked.getForPath(path) === v}>
                    {v === 'undefined' ? '' : v}
                </option>
            ))}
        </select>
    ) : (
        <input
            type="text"
            pattern={schema.pattern}
            required={required}
            class="form-control form-control-sm"
            id={elementIds.input}
            value={objectStore.useTracked.getForPath(path)}
            onChange={(e) => objectStore.set.setForPath(path, e.currentTarget.value)}
        />
    );
