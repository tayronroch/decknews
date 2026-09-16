import { authClient, AuthClientError, getSafeNext } from './auth-client'

describe('auth client', () => {
  const fetchMock = jest.fn<typeof fetch>()
  const response = (status: number, body?: unknown) =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
    }) as unknown as Response

  beforeAll(() => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
      writable: true,
    })
  })

  beforeEach(() => {
    fetchMock.mockReset()
  })

  afterAll(() => {
    delete (globalThis as { fetch?: typeof fetch }).fetch
  })

  it('allows only safe same-origin destinations', () => {
    expect(getSafeNext('/admin/roles')).toBe('/admin/roles')
    expect(getSafeNext('//evil.example')).toBe('/admin')
    expect(getSafeNext('/\\evil.example')).toBe('/admin')
    expect(getSafeNext('/%5C%5Cevil.example')).toBe('/admin')
    expect(getSafeNext('https://evil.example')).toBe('/admin')
    expect(getSafeNext(null)).toBe('/admin')
  })

  it('registers with an explicit JSON POST payload', async () => {
    fetchMock.mockResolvedValue(response(201, { user: { id: '1' } }))

    await authClient.register({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'password-password',
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/register',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({
          name: 'Ada',
          email: 'ada@example.com',
          password: 'password-password',
        }),
      })
    )
  })

  it('propagates HTTP status failures as AuthClientError', async () => {
    fetchMock.mockResolvedValue(response(401))

    await expect(
      authClient.login({ email: 'ada@example.com', password: 'wrong-password' })
    ).rejects.toMatchObject({ statusCode: 401 })
    await expect(
      authClient.login({ email: 'ada@example.com', password: 'wrong-password' })
    ).rejects.toBeInstanceOf(AuthClientError)
  })

  it('uses the current-user and logout endpoints', async () => {
    fetchMock
      .mockResolvedValueOnce(response(200, { user: { id: '1' } }))
      .mockResolvedValueOnce(response(204))

    await authClient.getCurrentUser()
    await authClient.logout()

    expect(fetchMock.mock.calls[0]).toEqual([
      '/api/v1/auth/me',
      expect.objectContaining({ credentials: 'same-origin' }),
    ])
    expect(fetchMock.mock.calls[1]).toEqual([
      '/api/v1/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    ])
  })
})
