export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>
        Painel Administrativo
      </h1>
      <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
        Área administrativa do MiniBlog.
      </p>
    </main>
  )
}
