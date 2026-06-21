const Brands = Presence.Assets({
  ComedyCentral: "/brands/comedycentral_logo.png",
  MTV: "/brands/mtv_logo.png",
  Nickelodeon: "/brands/nickelodeon_logo.png",
  Originals: "/brands/originals_logo.png",
  Showtime: "/brands/showtime_logo.png",
  Smithsonian: "/brands/smithsonian_logo.png",
})

export const getBrand = (pathname: string): { name: string; logo: string } | undefined => {
  const slug = pathname.match(/^\/brands\/([^/]+)/)?.[1]
  switch (slug) {
    case "p-originals-exclusives": return { name: "Paramount+ Originals & Exclusives", logo: Brands.Originals }
    case "showtime": return { name: "Showtime", logo: Brands.Showtime }
    case "comedy-central": return { name: "Comedy Central", logo: Brands.ComedyCentral }
    case "nickelodeon-junior": return { name: "Nickelodeon Junior", logo: Brands.Nickelodeon }
    case "nickelodeon": return { name: "Nickelodeon", logo: Brands.Nickelodeon }
    case "mtv": return { name: "MTV", logo: Brands.MTV }
    case "smithsonian": return { name: "Smithsonian Channel", logo: Brands.Smithsonian }
    default: return undefined
  }
}