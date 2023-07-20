import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const values = [
    { value: undefined, label: '' },
    { value: true, label: 'true' },
    { value: false, label: 'false' },
];

export const BooleanRenderer = ({ path, elementIds, schema, required }: SchemaTypeRendererProps) => {
    const value = objectStore.useTracked.getForPath(path);

    return (
        <select
            class="form-select form-select-sm"
            id={elementIds.input}
            required={required}
            value={value}
            onChange={(e) =>
                objectStore.set.setForPath(
                    path,
                    { true: true, false: false, undefined: undefined }[e.currentTarget.value]
                )
            }>
            {values
                .filter(
                    (v) =>
                        !schema.enum ||
                        schema.enum.includes(v.value as boolean) ||
                        (v.value === undefined && value === undefined) ||
                        value === v.value
                )
                .map(({ value: v, label }) => (
                    <option value={v + ''}>{label}</option>
                ))}
        </select>
    );
};
