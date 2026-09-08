export class InvalidPepperError extends Error {
  constructor(
    message = 'PASSWORD_PEPPER must be a non-empty string of at least 16 characters'
  ) {
    super(message)
    this.name = 'InvalidPepperError'
  }
}

export class InvalidHasherConfigError extends Error {
  constructor(message = 'Invalid password hasher configuration') {
    super(message)
    this.name = 'InvalidHasherConfigError'
  }
}
