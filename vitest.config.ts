import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: ['src/**/*.test.ts'],
        // Image/project fixtures are memory-heavy; bound local worker contention.
        maxWorkers: 4,
    },
});
