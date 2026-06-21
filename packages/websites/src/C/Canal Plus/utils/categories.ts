const CategoryAssets = Presence.Assets({
  Cinema: "/categories/cinema.png",
  Series: "/categories/series.png",
  Sport: "/categories/sport.png",
  Jeunesse: "/categories/jeunesse.png",
  Documentaires: "/categories/documentaire.png",
  Divertissement: "/categories/divertissement.png",
  PourVous: "/categories/pour-vous.png",
  Info: "/categories/info.png",
  Musique: "/categories/musique.png",
  CanalVod: "/categories/canal-vod.png",
  LaPresse: "/categories/la-presse.png",
  Sme: "/categories/sme.png",
  AudioDescription: "/categories/audio-description.png",
  Lsf: "/categories/lsf.png",
})

export type CanalCategory = {
  details: string
  image: string
  imageText: string
}

const categories: Array<{ path: string; category: CanalCategory }> = [
  {
    path: "/cinema",
    category: {
      details: "Browsing cinema",
      image: CategoryAssets.Cinema,
      imageText: "Movies",
    },
  },
  {
    path: "/series",
    category: {
      details: "Browsing series",
      image: CategoryAssets.Series,
      imageText: "Series",
    },
  },
  {
    path: "/sport",
    category: {
      details: "Browsing sports",
      image: CategoryAssets.Sport,
      imageText: "Sports",
    },
  },
  {
    path: "/jeunesse",
    category: {
      details: "Browsing kids",
      image: CategoryAssets.Jeunesse,
      imageText: "Kids",
    },
  },
  {
    path: "/documentaires",
    category: {
      details: "Browsing documentaries",
      image: CategoryAssets.Documentaires,
      imageText: "Documentaries",
    },
  },
  {
    path: "/divertissement",
    category: {
      details: "Browsing entertainment",
      image: CategoryAssets.Divertissement,
      imageText: "Entertainment",
    },
  },
  {
    path: "/selection-pour-vous",
    category: {
      details: "Browsing picks",
      image: CategoryAssets.PourVous,
      imageText: "For you",
    },
  },
  {
    path: "/info",
    category: {
      details: "Browsing news",
      image: CategoryAssets.Info,
      imageText: "News",
    },
  },
  {
    path: "/musique",
    category: {
      details: "Browsing music",
      image: CategoryAssets.Musique,
      imageText: "Music",
    },
  },
  {
    path: "/canal-vod",
    category: {
      details: "Browsing CANAL VOD",
      image: CategoryAssets.CanalVod,
      imageText: "CANAL VOD",
    },
  },
  {
    path: "/chaines-apps/la-presse",
    category: {
      details: "Browsing La Presse",
      image: CategoryAssets.LaPresse,
      imageText: "Press",
    },
  },
  {
    path: "/sous-titres-malentendants",
    category: {
      details: "Browsing SME content",
      image: CategoryAssets.Sme,
      imageText: "Deaf and hard-of-hearing subtitles",
    },
  },
  {
    path: "/audiodescription",
    category: {
      details: "Browsing audio description",
      image: CategoryAssets.AudioDescription,
      imageText: "Audio description",
    },
  },
  {
    path: "/langue-des-signes-francaise",
    category: {
      details: "Browsing LSF content",
      image: CategoryAssets.Lsf,
      imageText: "French sign language",
    },
  },
]

export const getCategory = (pathname: string): CanalCategory | undefined =>
  categories.find(({ path }) => pathname === path || pathname.startsWith(`${path}/`))?.category
