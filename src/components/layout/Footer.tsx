import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#111827' }}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm text-gray-400">
          <div>
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-widest">Tournament</h4>
            <div className="w-6 h-0.5 mb-3" style={{ background: '#dc2626' }} />
            <div className="space-y-1.5">
              <Link href="/schedule" className="block hover:text-white transition-colors">Full Schedule</Link>
              <Link href="/tournament/groups" className="block hover:text-white transition-colors">Groups</Link>
              <Link href="/tournament/teams" className="block hover:text-white transition-colors">Teams</Link>
              <Link href="/tournament/venues" className="block hover:text-white transition-colors">Venues</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-widest">Community</h4>
            <div className="w-6 h-0.5 mb-3" style={{ background: '#dc2626' }} />
            <div className="space-y-1.5">
              <Link href="/highlights" className="block hover:text-white transition-colors">Highlights</Link>
              <Link href="/discussions#crowd-pick" className="block hover:text-white transition-colors">Audience Poll</Link>
              <Link href="/discussions" className="block hover:text-white transition-colors">Discussions</Link>
              <Link href="/" className="block hover:text-white transition-colors">Home</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-semibold mb-2 text-xs uppercase tracking-widest">Account Access</h4>
            <div className="w-6 h-0.5 mb-3" style={{ background: '#dc2626' }} />
            <div className="space-y-1.5">
              <Link href="/auth/login" className="block hover:text-white transition-colors">Log in</Link>
              <Link href="/auth/register" className="block hover:text-white transition-colors">Register free</Link>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-gray-500" style={{ borderColor: '#1f2937' }}>
        Copyright © 2026 WorldCup FIFAFun 2026
      </div>
      <div className="text-center pb-5 text-xs flex items-center justify-center gap-3">
        <Link href="/disclaimer" className="text-yellow-500 hover:underline">Disclaimer</Link>
        <span className="text-gray-600">·</span>
        <Link href="/privacy" className="text-yellow-500 hover:underline">Privacy Policy</Link>
      </div>
    </footer>
  )
}
