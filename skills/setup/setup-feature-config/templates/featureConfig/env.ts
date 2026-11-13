// Where flags can be overridden from sessionStorage. Without overrides the app
// runs on the defaults with every `mock*` flag forced off.
export const overridesEnabled: boolean = import.meta.env.DEV;
