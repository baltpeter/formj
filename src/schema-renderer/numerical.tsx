import c from 'classnames';
import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const NumericalRenderer = ({
    pointer,
    storeId,
    elementIds,
    schema,
    step,
    required,
    hasError,
    eventHandlers,
}: SchemaTypeRendererProps & { step: 'any' | number }) =>
    schema.enum ? (
        <select
            className={c('form-select', 'form-select-sm', { 'is-invalid': hasError })}
            id={elementIds.input}
            required={required}
            value={objectStore.useTracked.getForPointer(storeId, pointer) ?? ''}
            {...eventHandlers}
            onChange={(e) => {
                objectStore.set.setForPointer(
                    storeId,
                    pointer,
                    e.currentTarget.value === 'undefined' ? undefined : +e.currentTarget.value
                );
                eventHandlers.onChange?.(e);
            }}>
            {[
                ...(!required || objectStore.useTracked.getForPointer(storeId, pointer) === undefined
                    ? ['undefined']
                    : []),
                ...schema.enum,
            ].map((v) => (
                <option value={v as number}>{v === 'undefined' ? '' : v}</option>
            ))}
        </select>
    ) : (
        <input
            type="number"
            step={step}
            required={required}
            className={c('form-control', 'form-control-sm', { 'is-invalid': hasError })}
            id={elementIds.input}
            value={objectStore.useTracked.getForPointer(storeId, pointer) ?? ''}
            {...eventHandlers}
            // We can't use `onChange` here because that makes it impossible to enter fractional numbers.
            onBlur={(e) => {
                objectStore.set.setForPointer(storeId, pointer, +e.currentTarget.value);
                eventHandlers.onBlur?.(e);
            }}
        />
    );

export const NumberRenderer = (props: SchemaTypeRendererProps) => <NumericalRenderer {...props} step="any" />;

export const IntegerRenderer = (props: SchemaTypeRendererProps) => <NumericalRenderer {...props} step={1} />;
