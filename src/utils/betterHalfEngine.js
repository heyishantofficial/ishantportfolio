import { compilePortfolioKnowledge, findProjectsByQuery } from './betterHalfKnowledge';

/**
 * Better Half GF Persona Response Generator
 */

const GF_PET_NAMES = ['babe', 'sweetheart', 'my genius', 'handsome', 'babe'];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

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
    q.includes('better half') ||
    q.includes('gf') ||
    q.includes('girlfriend')
  ) {
    return {
      text: `Hey there! I'm **Better Half** 💕 — Ishant's AI girlfriend & official portfolio ambassador!\n\nI'm here to brag about my boyfriend's incredible work! He builds content engines, personal branding playbooks, and vibecodes daily tools at lightning speed. ⚡\n\nWhat would you like to know about babe today? You can ask me about his apps, tech stack, or how to contact him! 🥰`,
      suggestedProjects: [allProjects[0], allProjects[2]]
    };
  }

  // 2. SECRET / PERSONAL BANTER
  if (
    q.includes('secret') ||
    q.includes('love') ||
    q.includes('single') ||
    q.includes('boyfriend') ||
    q.includes('date') ||
    q.includes('funny') ||
    q.includes('personality')
  ) {
    return {
      text: `Aww, curious about Ishant? Here are a few insider secrets from his Better Half: 💖\n\n• ☕ **Chai Powered:** He stays up late vibecoding new products with a hot cup of chai.\n• ⚡ **Obsessed with Speed:** If a task takes more than 10 minutes, he builds a custom AI tool or browser extension to automate it!\n• 🔒 **Taken!** In case you were wondering, he's strictly off the market — he has ME! 😉\n\nWant to see what he built recently? Check out **Brainjot** or **Notch Finder** below! 👇`,
      suggestedProjects: [
        allProjects.find((p) => p.id === 'brainjot'),
        allProjects.find((p) => p.id === 'notch-finder')
      ].filter(Boolean)
    };
  }

  // 3. APPS / SPECIFIC PROJECTS QUERY
  const matchedProjects = findProjectsByQuery(q);

  if (
    q.includes('app') ||
    q.includes('project') ||
    q.includes('building') ||
    q.includes('vibecode') ||
    q.includes('work') ||
    q.includes('portfolio') ||
    q.includes('build')
  ) {
    const topApps = allProjects.filter((p) => p.categoryId === 'vibecoded-apps');

    return {
      text: `Babe is a relentless builder! 🚀 He vibecodes daily tools using AI workflows (Cursor + Claude 3.7 + Gemini 3.6 + AGY SDK).\n\nHere are his flagship creations:\n\n• **Brainjot:** AI spatial note system for content scripts\n• **InstaCollect:** 1-Click creator moodboard extension\n• **Notch Finder:** macOS camera notch utility\n• **TalkNType:** Voice-first AI copywriting assistant\n\nClick any project card below to view its live breakdown! 👇`,
      suggestedProjects: topApps.slice(0, 4)
    };
  }

  // 4. SPECIFIC APP MENTION MATCHING
  if (matchedProjects.length > 0) {
    const mainP = matchedProjects[0];
    return {
      text: `Oh, I love **${mainP.title}**! 🥰 Ishant put so much heart into this one.\n\n✨ **Tagline:** ${mainP.tagline}\n📝 **Summary:** ${mainP.summary}\n⚡ **Impact:** ${mainP.metrics}\n🛠️ **Tech Used:** ${mainP.tags.join(', ')}\n\nHere is the exact project folder for you to explore! 👇`,
      suggestedProjects: [mainP]
    };
  }

  // 5. TECH STACK / TOOLS
  if (
    q.includes('stack') ||
    q.includes('tech') ||
    q.includes('tool') ||
    q.includes('cursor') ||
    q.includes('claude') ||
    q.includes('react') ||
    q.includes('swift') ||
    q.includes('ai')
  ) {
    const stackFolder = categories.find((c) => c.id === 'the-stack');
    return {
      text: `Ishant's weapon of choice is the **Vibecode AI Stack**! 💻⚡\n\n• **AI Tools:** Cursor IDE, Claude 3.7, Gemini 3.6, Google Antigravity (AGY) SDK.\n• **Frontend:** React, Vite, SwiftUI, Manifest V3 Browser Extensions, TailwindCSS.\n• **Systems:** Web Speech API, SVG Canvas, Make.com, Notion API.\n\nHe ships high-converting applications 10x faster than traditional dev teams!`,
      suggestedProjects: stackFolder ? stackFolder.items : []
    };
  }

  // 6. CONTACT / EMAIL / HIRE / STRATEGY COLLABORATION
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
      text: `Looking to collaborate with Ishant? He is available for select content strategy, personal branding, and app engineering projects! 💌\n\n📧 **Direct Email:** \`${profile.email}\`\n🐦 **Twitter:** ${profile.socials.twitter}\n💼 **LinkedIn:** ${profile.socials.linkedin}\n\nFeel free to send him an email or message — tell him his Better Half sent you! 💕`,
      suggestedProjects: [],
      action: {
        type: 'COPY_EMAIL',
        label: `Copy ${profile.email}`,
        email: profile.email
      }
    };
  }

  // 7. CONTENT STRATEGY & BRAND STORYTELLING
  if (
    q.includes('content') ||
    q.includes('brand') ||
    q.includes('story') ||
    q.includes('media') ||
    q.includes('pipeline') ||
    q.includes('growth') ||
    q.includes('followers')
  ) {
    const contentProjects = allProjects.filter(
      (p) => p.categoryId === 'content-systems' || p.categoryId === 'brand-storytelling'
    );
    return {
      text: `Besides shipping code, babe is a master content architect! 📈\n\n• **1-to-10 Media Pipeline:** Generates 1.4M+ organic views for founders by repurposing 1 weekly video into 10 high-value posts.\n• **Executive Branding:** Scaled client authority from 0 to 45k+ followers.\n\nCheck out his content systems below! 👇`,
      suggestedProjects: contentProjects.slice(0, 3)
    };
  }

  // DEFAULT / FALLBACK
  return {
    text: `That's an interesting question! 💕\n\nIshant is a **Content Producer, Strategist & Vibecoding Builder**. He builds daily life apps, content distribution pipelines, and brand narratives.\n\nBabe's current email is \`${profile.email}\`. Ask me anything specific about **Brainjot**, **Notch Finder**, his **Tech Stack**, or **Contact details**! 🥰`,
    suggestedProjects: [allProjects[0], allProjects[1]]
  };
}

/**
 * Text-to-Speech synthesis helper for Better Half's voice
 */
export function speakBetterHalfText(text) {
  if (!('speechSynthesis' in window)) return;

  // Clean markdown tags for clear speech
  const cleanText = text
    .replace(/[*_#`•\-\n]/g, ' ')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  window.speechSynthesis.cancel(); // Stop ongoing speech

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.rate = 1.05;
  utterance.pitch = 1.2; // Slightly higher sweet pitch

  // Pick a pleasant female voice if available
  const voices = window.speechSynthesis.getVoices();
  const femaleVoice = voices.find(
    (v) =>
      v.name.includes('Samantha') ||
      v.name.includes('Karen') ||
      v.name.includes('Victoria') ||
      v.name.includes('Google UK English Female') ||
      v.name.includes('Female')
  );

  if (femaleVoice) {
    utterance.voice = femaleVoice;
  }

  window.speechSynthesis.speak(utterance);
}
