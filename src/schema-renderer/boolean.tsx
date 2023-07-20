import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const values = [
    { value: undefined, label: '' },
    { value: true, label: 'true' },
    { value: false, label: 'false' },
];

export const BooleanRenderer = ({ path, elementIds, required }: SchemaTypeRendererProps) => {
    const value = objectStore.useTracked.getForPath(path);

    return (
        <select
            class="form-select"
            id={elementIds.input}
            required={required}
            onChange={(e) =>
                objectStore.set.setForPath(
                    path,
                    { true: true, false: false, undefined: undefined }[e.currentTarget.value]
                )
            }>
            {values.map(({ value: v, label }) => (
                <option value={v + ''} selected={value === v}>
                    {label}
                </option>
            ))}
        </select>
    );
};
