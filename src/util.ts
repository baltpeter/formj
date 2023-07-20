export const swapElements = <T>(array: T[], i: number, j: number): T[] => {
    if (i < 0 || i >= array.length || j < 0 || j >= array.length) throw new Error('Invalid index.');

    const arrayCopy = [...array];
    [arrayCopy[i], arrayCopy[j]] = [arrayCopy[j] as T, arrayCopy[i] as T];
    return arrayCopy;
};
