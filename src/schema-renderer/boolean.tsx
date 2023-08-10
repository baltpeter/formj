import c from 'classnames';
import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const values = [
    { value: undefined, label: '' },
    { value: true, label: 'true' },
    { value: false, label: 'false' },
];

export const BooleanRenderer = ({
    path,
    elementIds,
    schema,
    required,
    hasError,
    eventHandlers,
}: SchemaTypeRendererProps) => {
    const value = objectStore.useTracked.getForPath(path);

    return (
        <select
            className={c('form-select', 'form-select-sm', { 'is-invalid': hasError })}
            id={elementIds.input}
            required={required}
            value={value}
            {...eventHandlers}
            onChange={(e) => {
                objectStore.set.setForPath(path, { true: true, false: false, undefined }[e.currentTarget.value]);
                eventHandlers.onChange?.(e);
            }}>
            {values
                .filter(
                    (v) =>
                        !schema.enum ||
                        schema.enum.includes(v.value as boolean) ||
                        (v.value === undefined && value === undefined) ||
                        (v.value === undefined && !required) ||
                        value === v.value
                )
                .map(({ value: v, label }) => (
                    <option value={`${v}`}>{label}</option>
                ))}
        </select>
    );
};
