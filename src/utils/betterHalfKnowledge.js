import { FOLDERS_DATA, PROFILE_INFO } from '../data/foldersData';

/**
 * Dynamically ingests FOLDERS_DATA and PROFILE_INFO.
 * Whenever Ishant adds, modifies, or deletes projects/info in foldersData.js,
 * this function automatically compiles the latest knowledge for Better Half.
 */
export function compilePortfolioKnowledge() {
  const allProjects = [];
  const categories = [];

  FOLDERS_DATA.forEach((folder) => {
    const categoryInfo = {
      id: folder.id,
      title: folder.title,
      subtitle: folder.subtitle,
      tagline: folder.tagline,
      itemsCount: folder.items.length,
      items: folder.items
    };
    categories.push(categoryInfo);

    folder.items.forEach((item) => {
      allProjects.push({
        ...item,
        categoryTitle: folder.title,
        categoryId: folder.id
      });
    });
  });

  // Construct structured text representation for AI context
  const projectsSummaryText = allProjects
    .map(
      (p) =>
        `• [${p.title}] (${p.categoryTitle}) - ${p.tagline}. Summary: ${p.summary} Metrics: ${p.metrics}. Tech/Tags: ${p.tags.join(', ')}.`
    )
    .join('\n');

  const profileSummaryText = `
Name: ${PROFILE_INFO.name}
Role: Content Producer, Strategist & Vibecoding Builder
Email: ${PROFILE_INFO.email}
Handle: ${PROFILE_INFO.handle}
Tagline: ${PROFILE_INFO.tagline}
Social Links: Twitter (${PROFILE_INFO.socials.twitter}), LinkedIn (${PROFILE_INFO.socials.linkedin}), GitHub (${PROFILE_INFO.socials.github})
  `.trim();

  return {
    profile: PROFILE_INFO,
    categories,
    allProjects,
    projectsSummaryText,
    profileSummaryText,
    lastSyncTimestamp: new Date().toISOString()
  };
}

/**
 * Search for matching projects based on user query
 */
export function findProjectsByQuery(query) {
  const { allProjects } = compilePortfolioKnowledge();
  if (!query) return [];
  const q = query.toLowerCase();

  return allProjects.filter((p) => {
    return (
      p.title.toLowerCase().includes(q) ||
      p.tagline.toLowerCase().includes(q) ||
      p.summary.toLowerCase().includes(q) ||
      p.tags.some((tag) => tag.toLowerCase().includes(q)) ||
      p.categoryTitle.toLowerCase().includes(q)
    );
  });
}
