import { objectStore } from '../store';
import type { SchemaTypeRendererProps } from './index';

export const StringRenderer = ({ path, elementIds }: SchemaTypeRendererProps) => (
    <input
        type="text"
        class="form-control form-control-sm"
        id={elementIds.input}
        value={objectStore.useTracked.getForPath(path)}
        onChange={(e) => objectStore.set.setForPath(path, e.currentTarget.value)}
    />
);
