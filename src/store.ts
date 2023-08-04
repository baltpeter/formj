import { createStore } from '@udecode/zustood';

export const objectStore = createStore('object')({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    object: {} as Record<string, any>,
})
    .extendSelectors((state) => ({
        getForPath: (path: string) => {
            const pathSegments = path.replace(/^\$\./, '').split('.');
            const last = pathSegments.pop();
            if (!last) throw new Error('Invalid path');

            let current = state.object;
            for (const p of pathSegments) {
                current = Array.isArray(current) ? current[+p] : current[p];
                if (!current) return undefined;
            }
            return Array.isArray(current) ? current[+last] : current[last];
        },
    }))
    .extendActions((_set) => ({
        setForPath: (path: string, _value: unknown) => {
            const value = _value === '' || (Array.isArray(_value) && _value.length === 0) ? undefined : _value;

            _set.state((draft) => {
                // Adapted after: https://github.com/tweaselORG/TrackHAR/blob/6fadcff049054fa1d4ef4bc89dfb93267b6ad1a1/src/index.ts#L211-L225
                const pathSegments = path.replace(/^\$\./, '').split('.');
                const last = pathSegments.pop();
                if (!last) throw new Error('Invalid path');

                let current = draft.object;
                for (const p of pathSegments) {
                    let next = Array.isArray(current) ? current[+p] : current[p];
                    if (!next) (current as (typeof draft)['object'])[p] = {};
                    next = Array.isArray(current) ? current[+p] : current[p];
                    current = next;
                }
                if (Array.isArray(current)) current[+last] = value;
                else current[last] = value;
            });
        },
    }));
