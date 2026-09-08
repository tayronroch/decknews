export class UniqueConstraintError extends Error {
  constructor(
    public readonly fields: readonly string[],
    options?: ErrorOptions
  ) {
    super('Unique constraint violation', options)
    this.name = 'UniqueConstraintError'
  }
}
