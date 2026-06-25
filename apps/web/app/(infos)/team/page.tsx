import { TeamHeader } from "@/components/team/team-header";
import { TeamMemberCard } from "@/components/team/team-member-card";
import type { GithubMember, GithubProfile, GithubSocialAccount, TeamMember } from "@/features/team/types";
import { getSocialLinks } from "@/features/team/utils";
import { createMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { ReactElement } from "react";

const team: TeamMember[] = [
  { github: "q-kimi", fallback: "KM" },
  { github: "steellgold", fallback: "ST" },
];

const getGithubProfile = async (github: string): Promise<GithubMember> => {
  try {
    const [profileResponse, socialsResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${github}`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 60 * 60 },
      }),
      fetch(`https://api.github.com/users/${github}/social_accounts`, {
        headers: { Accept: "application/vnd.github+json" },
        next: { revalidate: 60 * 60 },
      }),
    ]);

    return {
      profile: profileResponse.ok ? await profileResponse.json() as GithubProfile : null,
      socials: socialsResponse.ok ? await socialsResponse.json() as GithubSocialAccount[] : [],
    };
  } catch {
    return { profile: null, socials: [] };
  }
};

const generateMetadata = (): Metadata => {
  return createMetadata({
    title: "Team",
    description: "Meet the people building Nowly.",
    path: "/team",
  });
};

const Page = async (): Promise<ReactElement> => {
  const t = await getTranslations("team-page");
  const githubMembers = await Promise.all(team.map((member) => getGithubProfile(member.github)));
  const labels = {
    github: t("links.github"),
    followers: t("followers"),
    following: t("following"),
    emptyBio: t("emptyBio"),
  };

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-4 pb-12 pt-28 md:px-6 md:py-24">
      <TeamHeader
        badge={t("badge")}
        title={t("title")}
        description={t("description")}
      />

      <div className="grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {team.map((member, index) => {
          const githubMember = githubMembers[index];
          const socials = getSocialLinks(githubMember, labels);

          return (
            <TeamMemberCard
              key={member.github}
              member={member}
              profile={githubMember.profile}
              socials={socials}
              labels={labels}
            />
          );
        })}
      </div>
    </main>
  );
};

export { generateMetadata };

export default Page;