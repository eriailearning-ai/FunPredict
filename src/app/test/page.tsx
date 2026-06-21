export default function TestPage() {
  return (
    <div style={{ padding: 40, fontFamily: 'monospace' }}>
      <h2>Direct login test</h2>
      <form action="/api/auth/login" method="POST">
        <div><input name="email" defaultValue="admin@example.com" style={{ width: 300, margin: 4 }} /></div>
        <div><input name="password" defaultValue="Admin123!" type="text" style={{ width: 300, margin: 4 }} /></div>
        <button type="submit" style={{ margin: 4, padding: '8px 16px' }}>POST Login</button>
      </form>
      <hr />
      <a href="/api/debug">Check DB</a>
    </div>
  )
}
