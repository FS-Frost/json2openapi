import { stringify } from 'yaml';

export const toJsonText = (value: unknown) => JSON.stringify(value, null, 2) + '\n';

/** YAML without line folding (long descriptions stay on one line), keys in insertion order. */
export const toYamlText = (value: unknown) => stringify(value, { lineWidth: 0, aliasDuplicateObjects: false });
