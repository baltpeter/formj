import c from 'classnames';
import type { JSX } from 'preact';
import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const formatToType = {
    email: 'email',
    'idn-email': 'email',
    uri: 'url',
    'date-time': 'datetime-local',
    date: 'date',
    time: 'time',
};

export const StringRenderer = ({
    pointer,
    elementIds,
    schema,
    required,
    hasError,
    eventHandlers,
}: SchemaTypeRendererProps) => {
    const value = objectStore.useTracked.getForPointer(pointer);
    const commonProps = {
        required,
        className: c('form-control', 'form-control-sm', { 'is-invalid': hasError }),
        id: elementIds.input,
        // See: https://github.com/baltpeter/formj/issues/5
        value: value ?? '',
        ...eventHandlers,
        onChange: (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            objectStore.set.setForPointer(pointer, e.currentTarget.value);
            eventHandlers.onChange?.(e);
        },
    };

    return schema.enum ? (
        <select
            {...commonProps}
            className={c('form-select', 'form-select-sm', { 'is-invalid': hasError })}
            onChange={(e) => {
                objectStore.set.setForPointer(
                    pointer,
                    e.currentTarget.value === 'undefined' ? undefined : e.currentTarget.value
                );
                eventHandlers.onChange?.(e);
            }}>
            {[...(!required || value === undefined ? ['undefined'] : []), ...schema.enum].map((v) => (
                <option value={v as number}>{v === 'undefined' ? '' : v}</option>
            ))}
        </select>
    ) : schema.format === 'text' ? (
        <textarea {...commonProps} rows={5} />
    ) : (
        <input
            {...commonProps}
            type={schema.format && schema.format in formatToType ? formatToType[schema.format as 'email'] : 'text'}
        />
    );
};
