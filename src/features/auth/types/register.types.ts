export type RegisterUserResult = {
  id: bigint
  name: string
  email: string
  createdAt: Date
}

export type RegisterSuccessResponse = {
  user: {
    id: string
    name: string
    email: string
    createdAt: string
  }
}
