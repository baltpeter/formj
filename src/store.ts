import { createStore } from '@udecode/zustood';
import jsonpointer from 'jsonpointer';

export const objectStore = createStore('object')({
    objects: {} as Record<string, Record<string, unknown>>,
})
    .extendSelectors((state) => ({
        getObject: (id: string) => state.objects[id] || {},
        getForPointer: (id: string, pointer: string) => jsonpointer.get(state.objects[id] || {}, pointer),
    }))
    .extendActions((set) => ({
        overrideObject: (id: string, object: Record<string, unknown>) => {
            set.state((draft) => {
                draft.objects[id] = object;
            });
        },

        setForPointer: (id: string, pointer: string, _value: unknown) => {
            const value = _value === '' || (Array.isArray(_value) && _value.length === 0) ? undefined : _value;

            set.state((draft) => {
                if (!draft.objects[id]) draft.objects[id] = {};

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                jsonpointer.set(draft.objects[id]!, pointer, value);
            });
        },
    }));
