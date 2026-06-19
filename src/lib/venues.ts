/**
 * WC 2026 host venues.
 * Single source of truth — used by both /tournament/venues and /tournament/venues/[slug].
 */
export type Venue = {
  name: string
  city: string
  capacity: string
  tz: string
  img: string       // slug / image filename without extension
  country: string
}

export const VENUES: Venue[] = [
  { name: 'Arrowhead Stadium',       city: 'Kansas City, MO',            capacity: '76,000+', tz: 'America/Chicago',     img: 'arrowhead-stadium',         country: 'USA'    },
  { name: 'AT&T Stadium',             city: 'Arlington, TX (Dallas)',     capacity: '80,000+', tz: 'America/Chicago',     img: 'at-and-t-stadium',          country: 'USA'    },
  { name: 'BC Place',                 city: 'Vancouver, BC',              capacity: '54,000+', tz: 'America/Vancouver',   img: 'bc-place',                  country: 'Canada' },
  { name: 'BMO Field',                city: 'Toronto, ON',                capacity: '45,000+', tz: 'America/Toronto',     img: 'bmo-field',                 country: 'Canada' },
  { name: 'Estadio Akron',            city: 'Guadalajara, Mexico',        capacity: '48,000+', tz: 'America/Mexico_City', img: 'estadio-akron',             country: 'Mexico' },
  { name: 'Estadio Azteca',           city: 'Mexico City, Mexico',        capacity: '87,000+', tz: 'America/Mexico_City', img: 'estadio-azteca',            country: 'Mexico' },
  { name: 'Estadio BBVA',             city: 'Monterrey, Mexico',          capacity: '53,000+', tz: 'America/Mexico_City', img: 'estadio-bbva',              country: 'Mexico' },
  { name: 'Gillette Stadium',         city: 'Foxborough, MA (Boston)',    capacity: '65,000+', tz: 'America/New_York',    img: 'gillette-stadium',          country: 'USA'    },
  { name: 'Hard Rock Stadium',        city: 'Miami Gardens, FL',          capacity: '65,000+', tz: 'America/New_York',    img: 'hard-rock-stadium',         country: 'USA'    },
  { name: "Levi's Stadium",           city: 'Santa Clara, CA (Bay Area)', capacity: '68,000+', tz: 'America/Los_Angeles', img: 'levis-stadium',             country: 'USA'    },
  { name: 'Lincoln Financial Field',  city: 'Philadelphia, PA',           capacity: '69,000+', tz: 'America/New_York',    img: 'lincoln-financial-field',   country: 'USA'    },
  { name: 'Lumen Field',              city: 'Seattle, WA',                capacity: '69,000+', tz: 'America/Los_Angeles', img: 'lumen-field',               country: 'USA'    },
  { name: 'Mercedes-Benz Stadium',    city: 'Atlanta, GA',                capacity: '71,000+', tz: 'America/New_York',    img: 'mercedes-benz-stadium',     country: 'USA'    },
  { name: 'MetLife Stadium',          city: 'New York / New Jersey',      capacity: '82,500',  tz: 'America/New_York',    img: 'metlife-stadium',           country: 'USA'    },
  { name: 'NRG Stadium',              city: 'Houston, TX',                capacity: '72,000+', tz: 'America/Chicago',     img: 'nrg-stadium',               country: 'USA'    },
  { name: 'SoFi Stadium',             city: 'Los Angeles, CA',            capacity: '70,000+', tz: 'America/Los_Angeles', img: 'sofi-stadium',              country: 'USA'    },
]
