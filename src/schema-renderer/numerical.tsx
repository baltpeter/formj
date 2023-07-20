import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const NumericalRenderer = ({
    path,
    elementIds,
    schema,
    step,
    required,
}: SchemaTypeRendererProps & { step: 'any' | number }) =>
    schema.enum ? (
        <select
            class="form-select form-select-sm"
            id={elementIds.input}
            required={required}
            onChange={(e) =>
                objectStore.set.setForPath(
                    path,
                    e.currentTarget.value === 'undefined' ? undefined : +e.currentTarget.value
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
            type="number"
            step={step}
            required={required}
            class="form-control form-control-sm"
            id={elementIds.input}
            value={objectStore.useTracked.getForPath(path)}
            // We can't use `onChange` here because that makes it impossible to enter fractional numbers.
            onBlur={(e) => objectStore.set.setForPath(path, +e.currentTarget.value)}
        />
    );

export const NumberRenderer = (props: SchemaTypeRendererProps) => <NumericalRenderer {...props} step="any" />;

export const IntegerRenderer = (props: SchemaTypeRendererProps) => <NumericalRenderer {...props} step={1} />;
