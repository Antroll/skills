/**
 * The one line that ties feature flags to the build tool: true in local
 * development, false in production builds.
 * Vite: `import.meta.env.DEV`.
 * Next.js, webpack and most others: `process.env.NODE_ENV !== 'production'`.
 */
export const isDev: boolean = import.meta.env.DEV;
