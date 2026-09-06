export type StatusResponse = {
  status: 'ok'
  updatedAt: string
  database: {
    status: 'healthy'
    connections: number
    poolLimit: number
  }
}
