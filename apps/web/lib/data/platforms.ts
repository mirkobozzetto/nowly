export type PlatformCategory = "streaming" | "musique" | "tv" | "anime" | "autre"
export type PlatformStatus = "available" | "soon" | "beta"

export interface Contributor {
  name: string
  github?: string
  avatar?: string
}

export interface Platform {
  id: string
  slug: string
  name: string
  description: string
  longDescription: string
  icon: string
  iconColor: string
  category: PlatformCategory
  status: PlatformStatus
  // Stats
  activeUsers: number
  totalInstalls: number
  rating: number
  // Dates
  addedAt: string
  lastUpdated: string
  // URLs prises en charge
  supportedUrls: string[]
  // Contributeurs
  contributors: Contributor[]
  // Features
  features: string[]
}

export const categories: { value: PlatformCategory; label: string }[] = [
  { value: "streaming", label: "Streaming" },
  { value: "musique", label: "Musique" },
  { value: "tv", label: "TV & Films" },
  { value: "anime", label: "Anime" },
  { value: "autre", label: "Autre" },
]

export const platforms: Platform[] = [
  {
    id: "1",
    slug: "youtube",
    name: "YouTube",
    description: "Regardez et partagez des videos sur la plus grande plateforme video au monde.",
    longDescription: "YouTube est la plateforme de partage de videos la plus populaire au monde. Avec Presence Discord, affichez automatiquement la video que vous regardez, qu'il s'agisse de musique, de tutoriels, de streams en direct ou de tout autre contenu. Vos amis pourront voir exactement ce que vous visionnez en temps reel.",
    icon: "youtube",
    iconColor: "#ff0000",
    category: "streaming",
    status: "available",
    activeUsers: 2341,
    totalInstalls: 15420,
    rating: 4.8,
    addedAt: "2024-01-15",
    lastUpdated: "2024-12-20",
    supportedUrls: ["youtube.com", "www.youtube.com", "youtu.be", "music.youtube.com"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" }
    ],
    features: [
      "Detection automatique des videos",
      "Affichage du titre et de la chaine",
      "Temps de visionnage en temps reel",
      "Support des lives et premieres",
      "Miniature de la video"
    ]
  },
  {
    id: "2",
    slug: "twitch",
    name: "Twitch",
    description: "La plateforme de streaming en direct pour les gamers et createurs.",
    longDescription: "Twitch est la reference du streaming en direct. Presence Discord detecte automatiquement le stream que vous regardez et affiche les informations du streamer, le jeu en cours et votre temps de visionnage. Parfait pour montrer a vos amis quel stream vous suivez.",
    icon: "twitch",
    iconColor: "#9146ff",
    category: "streaming",
    status: "available",
    activeUsers: 1872,
    totalInstalls: 12350,
    rating: 4.9,
    addedAt: "2024-01-10",
    lastUpdated: "2024-12-18",
    supportedUrls: ["twitch.tv", "www.twitch.tv"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" }
    ],
    features: [
      "Detection des streams en direct",
      "Affichage du streamer et du jeu",
      "Temps de visionnage",
      "Support des VODs",
      "Categorie du stream"
    ]
  },
  {
    id: "3",
    slug: "prime-video",
    name: "Prime Video",
    description: "Le service de streaming d'Amazon avec films et series exclusives.",
    longDescription: "Amazon Prime Video offre un catalogue riche de films et series. Presence Discord affiche automatiquement ce que vous regardez, incluant le titre, la saison et l'episode pour les series, ainsi que votre progression dans le contenu.",
    icon: "prime",
    iconColor: "#00a8e1",
    category: "tv",
    status: "available",
    activeUsers: 1245,
    totalInstalls: 8920,
    rating: 4.6,
    addedAt: "2024-02-01",
    lastUpdated: "2024-12-15",
    supportedUrls: ["primevideo.com", "www.primevideo.com", "amazon.com/video", "amazon.fr/video"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" }
    ],
    features: [
      "Detection des films et series",
      "Affichage saison/episode",
      "Progression de lecture",
      "Poster du contenu",
      "Support 4K HDR"
    ]
  },
  {
    id: "4",
    slug: "plex",
    name: "Plex",
    description: "Gerez et streamez votre bibliotheque multimedia personnelle.",
    longDescription: "Plex vous permet d'organiser et de streamer votre propre collection de medias. Presence Discord s'integre parfaitement pour afficher les films, series ou musiques de votre bibliotheque personnelle que vous etes en train de regarder ou d'ecouter.",
    icon: "plex",
    iconColor: "#e5a00d",
    category: "autre",
    status: "available",
    activeUsers: 876,
    totalInstalls: 5640,
    rating: 4.7,
    addedAt: "2024-01-20",
    lastUpdated: "2024-12-10",
    supportedUrls: ["app.plex.tv", "plex.tv"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" }
    ],
    features: [
      "Support films et series",
      "Bibliotheque musicale",
      "Metadonnees automatiques",
      "Progression synchronisee",
      "Multi-serveurs"
    ]
  },
  {
    id: "5",
    slug: "netflix",
    name: "Netflix",
    description: "Le leader mondial du streaming avec des contenus originaux exclusifs.",
    longDescription: "Netflix est le service de streaming le plus populaire au monde. Presence Discord detecte automatiquement vos sessions de visionnage et affiche le titre du film ou de la serie, l'episode en cours, et votre progression. Partagez vos marathons de series avec vos amis Discord.",
    icon: "netflix",
    iconColor: "#E50914",
    category: "tv",
    status: "available",
    activeUsers: 3421,
    totalInstalls: 18750,
    rating: 4.9,
    addedAt: "2024-01-05",
    lastUpdated: "2024-12-22",
    supportedUrls: ["netflix.com", "www.netflix.com"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" },
      { name: "Contributor2", github: "contributor2" }
    ],
    features: [
      "Detection automatique",
      "Affichage titre et episode",
      "Progression en temps reel",
      "Poster et miniature",
      "Support des profils"
    ]
  },
  {
    id: "6",
    slug: "spotify",
    name: "Spotify",
    description: "Ecoutez des millions de titres et podcasts en streaming.",
    longDescription: "Spotify est le leader du streaming musical. Presence Discord affiche la musique que vous ecoutez en temps reel : artiste, titre, album et progression. Montrez vos gouts musicaux a vos amis et decouvrez ce qu'ils ecoutent.",
    icon: "spotify",
    iconColor: "#1db954",
    category: "musique",
    status: "available",
    activeUsers: 4210,
    totalInstalls: 22100,
    rating: 4.8,
    addedAt: "2024-01-01",
    lastUpdated: "2024-12-21",
    supportedUrls: ["open.spotify.com", "spotify.com"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" }
    ],
    features: [
      "Artiste et titre en temps reel",
      "Pochette d'album",
      "Progression du morceau",
      "Support des podcasts",
      "Playlists et albums"
    ]
  },
  {
    id: "7",
    slug: "disney-plus",
    name: "Disney+",
    description: "L'univers Disney, Pixar, Marvel, Star Wars et National Geographic.",
    longDescription: "Disney+ rassemble tout l'univers Disney en un seul endroit. Bientot, Presence Discord vous permettra d'afficher les films et series Disney, Pixar, Marvel, Star Wars et National Geographic que vous regardez.",
    icon: "disney",
    iconColor: "#113CCF",
    category: "tv",
    status: "soon",
    activeUsers: 0,
    totalInstalls: 0,
    rating: 0,
    addedAt: "2024-06-01",
    lastUpdated: "2024-06-01",
    supportedUrls: ["disneyplus.com", "www.disneyplus.com"],
    contributors: [],
    features: [
      "Contenu Disney, Pixar, Marvel",
      "Star Wars et Nat Geo",
      "Affichage des titres",
      "Progression de lecture",
      "Support IMAX Enhanced"
    ]
  },
  {
    id: "8",
    slug: "hbo-max",
    name: "HBO Max",
    description: "Les meilleures series HBO et films Warner Bros.",
    longDescription: "HBO Max propose un catalogue premium avec les series HBO, les films Warner Bros et des contenus exclusifs. Support bientot disponible pour afficher vos sessions de visionnage dans Discord.",
    icon: "hbo",
    iconColor: "#542EE0",
    category: "tv",
    status: "soon",
    activeUsers: 0,
    totalInstalls: 0,
    rating: 0,
    addedAt: "2024-07-01",
    lastUpdated: "2024-07-01",
    supportedUrls: ["max.com", "hbomax.com"],
    contributors: [],
    features: [
      "Series HBO originales",
      "Films Warner Bros",
      "Documentaires",
      "Progression de lecture",
      "Qualite 4K"
    ]
  },
  {
    id: "9",
    slug: "apple-tv",
    name: "Apple TV+",
    description: "Les productions originales Apple avec des createurs de renom.",
    longDescription: "Apple TV+ propose des productions originales de haute qualite. Le support est en cours de developpement pour afficher vos series et films Apple TV+ dans votre statut Discord.",
    icon: "apple",
    iconColor: "#A1A1A6",
    category: "tv",
    status: "soon",
    activeUsers: 0,
    totalInstalls: 0,
    rating: 0,
    addedAt: "2024-08-01",
    lastUpdated: "2024-08-01",
    supportedUrls: ["tv.apple.com"],
    contributors: [],
    features: [
      "Contenus originaux Apple",
      "Qualite Dolby Vision",
      "Audio spatial",
      "Affichage du titre",
      "Progression de lecture"
    ]
  },
  {
    id: "10",
    slug: "crunchyroll",
    name: "Crunchyroll",
    description: "La plus grande bibliotheque d'anime en streaming.",
    longDescription: "Crunchyroll est la reference pour regarder des animes en streaming legal. Bientot, affichez l'anime que vous regardez, l'episode en cours et votre progression directement dans Discord.",
    icon: "crunchyroll",
    iconColor: "#F47521",
    category: "anime",
    status: "soon",
    activeUsers: 0,
    totalInstalls: 0,
    rating: 0,
    addedAt: "2024-05-01",
    lastUpdated: "2024-05-01",
    supportedUrls: ["crunchyroll.com", "www.crunchyroll.com"],
    contributors: [],
    features: [
      "Catalogue anime complet",
      "Simulcast",
      "VOSTFR et VF",
      "Affichage anime/episode",
      "Progression de lecture"
    ]
  },
  {
    id: "11",
    slug: "cinepulse",
    name: "Cinepulse",
    description: "Decouvrez et suivez vos films et series preferes.",
    longDescription: "Cinepulse est une plateforme communautaire pour les cinephiles. Suivez vos films, notez-les et decouvrez de nouvelles perles. Support disponible pour afficher votre activite dans Discord.",
    icon: "cinepulse",
    iconColor: "#ffffff",
    category: "autre",
    status: "available",
    activeUsers: 542,
    totalInstalls: 3200,
    rating: 4.5,
    addedAt: "2024-03-01",
    lastUpdated: "2024-11-28",
    supportedUrls: ["cinepulse.app", "www.cinepulse.app"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" }
    ],
    features: [
      "Suivi de films",
      "Listes personnalisees",
      "Notes et critiques",
      "Recommandations",
      "Statistiques de visionnage"
    ]
  },
  {
    id: "12",
    slug: "nakastream",
    name: "Nakastream",
    description: "Plateforme de streaming anime independante.",
    longDescription: "Nakastream est une plateforme de streaming anime alternative. Presence Discord supporte la detection de vos sessions de visionnage pour afficher l'anime en cours dans votre statut.",
    icon: "nakastream",
    iconColor: "#C8A468",
    category: "anime",
    status: "beta",
    activeUsers: 287,
    totalInstalls: 1850,
    rating: 4.3,
    addedAt: "2024-04-15",
    lastUpdated: "2024-12-05",
    supportedUrls: ["nakastream.fr", "www.nakastream.fr"],
    contributors: [
      { name: "qkimi", github: "q-kimi", avatar: "https://avatars.githubusercontent.com/u/51194216?v=4" },
      { name: "NakaTeam", github: "nakateam" }
    ],
    features: [
      "Catalogue anime",
      "Lecteur personnalise",
      "VOSTFR",
      "Detection automatique",
      "Progression synchronisee"
    ]
  },
]

export const getPlatformBySlug = (slug: string): Platform | undefined => {
  return platforms.find((p) => p.slug === slug)
}

export const getPlatformsByCategory = (category: PlatformCategory): Platform[] => {
  return platforms.filter((p) => p.category === category)
}

export const getAvailablePlatforms = (): Platform[] => {
  return platforms.filter((p) => p.status === "available")
}

export const searchPlatforms = (query: string): Platform[] => {
  const lowerQuery = query.toLowerCase()
  return platforms.filter((p) =>
    p.name.toLowerCase().includes(lowerQuery) ||
    p.description.toLowerCase().includes(lowerQuery)
  )
}
