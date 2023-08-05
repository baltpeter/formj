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

export const StringRenderer = ({ path, elementIds, schema, required, hasError }: SchemaTypeRendererProps) => {
    const commonProps = {
        pattern: schema.pattern,
        required,
        className: c('form-control', 'form-control-sm', { 'is-invalid': hasError }),
        id: elementIds.input,
        value: objectStore.useTracked.getForPath(path),
        onChange: (e: JSX.TargetedEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            objectStore.set.setForPath(path, e.currentTarget.value),
    };

    return schema.enum ? (
        <select
            {...commonProps}
            className={c('form-select', 'form-select-sm', { 'is-invalid': hasError })}
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
        <input
            {...commonProps}
            type={schema.format && schema.format in formatToType ? formatToType[schema.format as 'email'] : 'text'}
        />
    );
};
