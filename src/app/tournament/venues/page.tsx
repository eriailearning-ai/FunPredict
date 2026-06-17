import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import SafeImg from '@/components/ui/SafeImg'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const revalidate = 3600

const VENUES = [
  { name: 'Estadio Azteca', city: 'Mexico City', country: 'Mexico', capacity: '87,523', img: 'estadio-azteca' },
  { name: 'SoFi Stadium', city: 'Los Angeles', country: 'USA', capacity: '70,240', img: 'sofi-stadium' },
  { name: 'MetLife Stadium', city: 'New York / New Jersey', country: 'USA', capacity: '82,500', img: 'metlife-stadium' },
  { name: 'AT&T Stadium', city: 'Dallas', country: 'USA', capacity: '80,000', img: 'att-stadium' },
  { name: 'Levi\'s Stadium', city: 'Santa Clara', country: 'USA', capacity: '68,500', img: 'levis-stadium' },
  { name: 'Hard Rock Stadium', city: 'Miami', country: 'USA', capacity: '65,326', img: 'hard-rock-stadium' },
  { name: 'Arrowhead Stadium', city: 'Kansas City', country: 'USA', capacity: '76,416', img: 'arrowhead-stadium' },
  { name: 'Lincoln Financial Field', city: 'Philadelphia', country: 'USA', capacity: '69,176', img: 'lincoln-financial-field' },
  { name: 'Gillette Stadium', city: 'Boston', country: 'USA', capacity: '65,878', img: 'gillette-stadium' },
  { name: 'NRG Stadium', city: 'Houston', country: 'USA', capacity: '72,220', img: 'nrg-stadium' },
  { name: 'BMO Field', city: 'Toronto', country: 'Canada', capacity: '30,000', img: 'bmo-field' },
  { name: 'BC Place', city: 'Vancouver', country: 'Canada', capacity: '54,500', img: 'bc-place' },
  { name: 'Estadio BBVA', city: 'Monterrey', country: 'Mexico', capacity: '53,500', img: 'estadio-bbva' },
  { name: 'Estadio Akron', city: 'Guadalajara', country: 'Mexico', capacity: '49,850', img: 'estadio-akron' },
  { name: 'Estadio Ciudad de México', city: 'Mexico City', country: 'Mexico', capacity: '55,000', img: 'estadio-cdmx' },
  { name: 'Seattle Lumen Field', city: 'Seattle', country: 'USA', capacity: '68,740', img: 'lumen-field' },
]

export default async function VenuesPage() {
  const [sidebarData, session] = await Promise.all([getSidebarData(), getSession().catch(() => null)])

  return (
    <div className="min-h-screen" style={{ background: '#f4f6fb' }}>
      <Navbar user={session ? { name: session.name, nickname: (session as any).nickname, role: session.role } : null} />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6">
        <nav className="text-xs text-gray-400 mb-4">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-2">→</span>
          <Link href="/tournament" className="hover:underline">Matches</Link>
          <span className="mx-2">→</span>
          <span className="text-gray-700">Venues</span>
        </nav>

        <div className="flex flex-col lg:flex-row gap-6">
          <main className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Venues</h1>
            <p className="text-sm text-gray-500 mb-5">16 host stadiums across USA, Mexico, and Canada.</p>

            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {VENUES.map(v => (
                <div key={v.name} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Venue image placeholder */}
                  <div className="h-36 relative flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #8b1c2c)' }}>
                    <SafeImg
                      src={`/images/venues/${v.img}.jpg`}
                      alt={v.name}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                    <span className="relative text-white text-4xl opacity-20">🏟️</span>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-gray-900">{v.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{v.city} · {v.country}</p>
                    <p className="text-xs text-gray-400 mt-1">Capacity: {v.capacity}</p>
                  </div>
                </div>
              ))}
            </div>
          </main>

          <Sidebar {...sidebarData} isLoggedIn={!!session} />
        </div>
      </div>

      <Footer />
    </div>
  )
}
