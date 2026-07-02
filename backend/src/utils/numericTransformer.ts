import { ValueTransformer } from 'typeorm';

// Postgres numeric/decimal columns come back from node-postgres as strings to avoid
// silent precision loss; lat/lng/rating are safe to round-trip as JS numbers at the
// precision we store them (BLUE_PRINT.md Section 3), so we convert on the way out.
export const numericTransformer: ValueTransformer = {
  to: (value: number | null | undefined): number | null | undefined => value,
  from: (value: string | null): number | null => (value === null ? null : parseFloat(value)),
};
