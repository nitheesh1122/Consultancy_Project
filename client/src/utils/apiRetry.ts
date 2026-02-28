export const withRetry = async <T,>(fn: () => Promise<T>, maxRetries = 1): Promise<T> => {
    try {
        return await fn();
    } catch (err: any) {
        if (err.response?.status === 409 && maxRetries > 0) {
            return await withRetry(fn, maxRetries - 1);
        }
        throw err;
    }
};
