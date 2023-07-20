import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

const NumericalRenderer = ({ path, elementIds, step }: SchemaTypeRendererProps & { step: 'any' | number }) => (
    <input
        type="number"
        step={step}
        class="form-control form-control-sm"
        id={elementIds.input}
        value={objectStore.useTracked.getForPath(path)}
        // We can't use `onChange` here because that makes it impossible to enter fractional numbers.
        onBlur={(e) => objectStore.set.setForPath(path, +e.currentTarget.value)}
    />
);

export const NumberRenderer = (props: SchemaTypeRendererProps) => <NumericalRenderer {...props} step="any" />;

export const IntegerRenderer = (props: SchemaTypeRendererProps) => <NumericalRenderer {...props} step={1} />;
