export default function HomePage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      }}
    >
      <h1
        style={{
          fontSize: '2.5rem',
          fontWeight: 'bold',
          marginBottom: '1rem',
          color: '#38bdf8',
        }}
      >
        Decknews MiniBlog
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '600px' }}>
        Fundação monolítica inicial da aplicação Next.js configurada com App
        Router, TypeScript e arquitetura modular por domínio.
      </p>
    </main>
  )
}
