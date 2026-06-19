import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Footer from '@/components/layout/Footer'
import { getSidebarData } from '@/lib/sidebar'
import { getSession } from '@/lib/auth'
import Link from 'next/link'

export const revalidate = 3600

const VENUES = [
  { name: 'Arrowhead Stadium',       city: 'Kansas City, MO',           capacity: '76,000+', tz: 'America/Chicago',    img: 'arrowhead-stadium'      },
  { name: 'AT&T Stadium',             city: 'Arlington, TX (Dallas)',    capacity: '80,000+', tz: 'America/Chicago',    img: 'at-and-t-stadium'       },
  { name: 'BC Place',                 city: 'Vancouver, BC',             capacity: '54,000+', tz: 'America/Vancouver',  img: 'bc-place'               },
  { name: 'BMO Field',                city: 'Toronto, ON',               capacity: '45,000+', tz: 'America/Toronto',    img: 'bmo-field'              },
  { name: 'Estadio Akron',            city: 'Guadalajara, Mexico',       capacity: '48,000+', tz: 'America/Mexico_City',img: 'estadio-akron'          },
  { name: 'Estadio Azteca',           city: 'Mexico City, Mexico',       capacity: '87,000+', tz: 'America/Mexico_City',img: 'estadio-azteca'         },
  { name: 'Estadio BBVA',             city: 'Monterrey, Mexico',         capacity: '53,000+', tz: 'America/Mexico_City',img: 'estadio-bbva'           },
  { name: 'Gillette Stadium',         city: 'Foxborough, MA (Boston)',   capacity: '65,000+', tz: 'America/New_York',   img: 'gillette-stadium'       },
  { name: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',         capacity: '65,000+', tz: 'America/New_York',   img: 'hard-rock-stadium'      },
  { name: "Levi's Stadium",           city: 'Santa Clara, CA (Bay Area)',capacity: '68,000+', tz: 'America/Los_Angeles',img: 'levis-stadium'          },
  { name: 'Lincoln Financial Field',  city: 'Philadelphia, PA',          capacity: '69,000+', tz: 'America/New_York',   img: 'lincoln-financial-field'},
  { name: 'Lumen Field',              city: 'Seattle, WA',               capacity: '69,000+', tz: 'America/Los_Angeles',img: 'lumen-field'            },
  { name: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',               capacity: '71,000+', tz: 'America/New_York',   img: 'mercedes-benz-stadium'  },
  { name: 'MetLife Stadium',          city: 'New York / New Jersey',     capacity: '82,500',  tz: 'America/New_York',   img: 'metlife-stadium'        },
  { name: 'NRG Stadium',              city: 'Houston, TX',               capacity: '72,000+', tz: 'America/Chicago',    img: 'nrg-stadium'            },
  { name: 'SoFi Stadium',             city: 'Los Angeles, CA',           capacity: '70,000+', tz: 'America/Los_Angeles',img: 'sofi-stadium'           },
]

function localTime(tz: string) {
  return new Date().toLocaleString('en-US', {
    timeZone: tz,
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

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
                <div key={v.name} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100">
                  {/* Venue photo — gradient+emoji fallback sits behind the image */}
                  <div className="h-40 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#0d1b3e,#1e3a5f)' }}>
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">🏟️</div>
                    <img
                      src={`/images/venues/${v.img}.jpg`}
                      alt={v.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-sm text-gray-900 mb-0.5">{v.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{v.city}</p>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Capacity</span>
                        <span className="font-semibold text-gray-700">{v.capacity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Local time</span>
                        <span className="font-medium text-gray-600">{localTime(v.tz)}</span>
                      </div>
                    </div>
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
