export type AuthenticateUserResult = {
  id: bigint
  name: string
  email: string
}

export type LoginSuccessResponse = {
  user: {
    id: string
    name: string
    email: string
  }
}
