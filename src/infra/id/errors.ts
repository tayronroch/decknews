export class ClockRollbackError extends Error {
  constructor(message = 'Clock moved backwards. Refusing to generate id.') {
    super(message)
    this.name = 'ClockRollbackError'
  }
}

export class InvalidIdGeneratorConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidIdGeneratorConfigError'
  }
}
