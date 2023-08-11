import { createStore } from '@udecode/zustood';
import jsonpointer from 'jsonpointer';

export const objectStore = createStore('object')({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: {} as Record<string, any>,
})
    .extendSelectors((state) => ({
        getForPointer: (pointer: string) => jsonpointer.get(state.object, pointer),
    }))
    .extendActions((_set) => ({
        setForPointer: (pointer: string, _value: unknown) => {
            const value = _value === '' || (Array.isArray(_value) && _value.length === 0) ? undefined : _value;

            _set.state((draft) => {
                jsonpointer.set(draft.object, pointer, value);
            });
        },
    }));
