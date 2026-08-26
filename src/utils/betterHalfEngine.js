import { compilePortfolioKnowledge, findProjectsByQuery } from './betterHalfKnowledge';

/**
 * AI Portfolio Co-pilot Response Generator
 * Provides concise, intelligent, high-density answers about Ishant's work,
 * engineering stack, content systems, and contact channels.
 */

export function generateBetterHalfResponse(userMessage) {
  const q = userMessage.trim().toLowerCase();
  const knowledge = compilePortfolioKnowledge();
  const { profile, allProjects, categories } = knowledge;

  // 1. GREETINGS & IDENTITY
  if (
    q.includes('who are you') ||
    q.includes('what is your name') ||
    q.includes('hello') ||
    q.includes('hi') ||
    q.includes('hey') ||
    q.includes('assistant') ||
    q.includes('co-pilot') ||
    q.includes('copilot') ||
    q.includes('ai')
  ) {
    return {
      text: `Hello. I'm Ishant's **AI Portfolio Co-pilot** ⚡\n\nI have complete visibility into his applications, engineering workflows, content distribution engines, and personal branding playbooks.\n\nHow can I assist you today? You can ask about his **featured apps**, **tech stack**, **content strategy**, or **contact details**.`,
      suggestedProjects: [
        allProjects.find((p) => p.id === 'brainjot'),
        allProjects.find((p) => p.id === 'instacollect')
      ].filter(Boolean)
    };
  }

  // 2. APPS / SPECIFIC PROJECTS OVERVIEW
  const matchedProjects = findProjectsByQuery(q);

  if (
    q.includes('app') ||
    q.includes('project') ||
    q.includes('building') ||
    q.includes('vibecode') ||
    q.includes('work') ||
    q.includes('portfolio') ||
    q.includes('build') ||
    q.includes('featured')
  ) {
    const topApps = allProjects.filter((p) => p.categoryId === 'vibecoded-apps');

    return {
      text: `Ishant specializes in rapid product development via modern AI workflows.\n\n**Flagship Builds:**\n• **Brainjot:** AI spatial note system for content scripts & braindumps\n• **InstaCollect:** 1-Click creator moodboard browser extension\n• **Notch Finder:** macOS utility transforming the camera notch into a creator shelf\n• **TalkNType:** Voice-first AI copywriting assistant\n\nSelect any card below to launch the detailed project breakdown.`,
      suggestedProjects: topApps.slice(0, 4)
    };
  }

  // 3. SPECIFIC APP MATCHING
  if (matchedProjects.length > 0) {
    const mainP = matchedProjects[0];
    return {
      text: `### ${mainP.title}\n*${mainP.tagline}*\n\n• **Overview:** ${mainP.summary}\n• **Metrics:** ${mainP.metrics}\n• **Stack:** ${mainP.tags.join(' • ')}\n\nClick the project card below to inspect details.`,
      suggestedProjects: [mainP]
    };
  }

  // 4. TECH STACK & SYSTEM ARCHITECTURE
  if (
    q.includes('stack') ||
    q.includes('tech') ||
    q.includes('tool') ||
    q.includes('cursor') ||
    q.includes('claude') ||
    q.includes('react') ||
    q.includes('swift') ||
    q.includes('architecture')
  ) {
    const stackFolder = categories.find((c) => c.id === 'the-stack');
    return {
      text: `**Engineering & AI Stack** 💻⚡\n\n• **AI Workflows:** Cursor IDE, Claude 3.7, Gemini 3.6, AGY SDK\n• **Frontend & Apps:** React, Vite, TailwindCSS, Manifest V3, SwiftUI\n• **APIs & Audio:** Web Speech API, Web Audio API, Notion API, Make.com\n\nDesigned to ship production-ready tools and browser extensions 10x faster than traditional pipelines.`,
      suggestedProjects: stackFolder ? stackFolder.items : []
    };
  }

  // 5. CONTACT / EMAIL / COLLABORATION
  if (
    q.includes('contact') ||
    q.includes('email') ||
    q.includes('hire') ||
    q.includes('reach') ||
    q.includes('mail') ||
    q.includes('twitter') ||
    q.includes('linkedin') ||
    q.includes('collab') ||
    q.includes('work with')
  ) {
    return {
      text: `Ishant is open for select content strategy, personal branding, and app engineering collaborations.\n\n• **Email:** \`${profile.email}\`\n• **LinkedIn:** ${profile.socials.linkedin}\n• **Twitter:** ${profile.socials.twitter}\n\nClick below to quickly copy his direct email address:`,
      suggestedProjects: [],
      action: {
        type: 'COPY_EMAIL',
        label: `Copy ${profile.email}`,
        email: profile.email
      }
    };
  }

  // 6. CONTENT STRATEGY & NARRATIVE SYSTEMS
  if (
    q.includes('content') ||
    q.includes('brand') ||
    q.includes('story') ||
    q.includes('media') ||
    q.includes('pipeline') ||
    q.includes('growth') ||
    q.includes('strategy')
  ) {
    const contentProjects = allProjects.filter(
      (p) => p.categoryId === 'content-systems' || p.categoryId === 'brand-storytelling'
    );
    return {
      text: `**Content Systems & Founder Branding** 📈\n\n• **1-to-10 Media Pipeline:** Converts 1 weekly video into 10 high-value multi-platform posts (1.4M+ organic views).\n• **Executive Branding:** Scaled client authority (+45k followers) through structured narrative arcs.\n• **Viral Hook Matrix:** 3-second hook frameworks achieving 72%+ retention.`,
      suggestedProjects: contentProjects.slice(0, 3)
    };
  }

  // DEFAULT / FALLBACK
  return {
    text: `I'm Ishant's **AI Portfolio Co-pilot**.\n\nIshant is a **Content Producer, Strategist & Vibecoding Builder**. He builds software utilities, media distribution systems, and founder brand strategies.\n\nAsk me about **Brainjot**, **Notch Finder**, his **Tech Stack**, or **Direct Contact**.`,
    suggestedProjects: [allProjects[0], allProjects[1]].filter(Boolean)
  };
}

/**
 * Clean Text-to-Speech synthesis helper
 */
export function speakBetterHalfText(text) {
  if (!('speechSynthesis' in window)) return;

  const cleanText = text
    .replace(/[*_#`•\-\n]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const naturalVoice = voices.find(
    (v) =>
      v.name.includes('Google') ||
      v.name.includes('Samantha') ||
      v.name.includes('Daniel') ||
      v.name.includes('Karen') ||
      v.name.includes('Natural')
  );

  if (naturalVoice) {
    utterance.voice = naturalVoice;
  }

  window.speechSynthesis.speak(utterance);
}
