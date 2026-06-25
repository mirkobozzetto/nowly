import type { FC, SVGProps } from "react";

export type GithubProfile = {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  bio: string | null
  blog: string | null
  email: string | null
  twitter_username: string | null
  location: string | null
  followers: number
  following: number
};

export type GithubSocialAccount = {
  provider: string
  url: string
  display_name: string | null
};

export type GithubMember = {
  profile: GithubProfile | null
  socials: GithubSocialAccount[]
};

export type TeamMember = {
  github: string
  fallback: string
};

export type SocialLink = {
  label: string
  href: string
  icon: FC<SVGProps<SVGSVGElement>>
};