// IshantOS — the portfolio's information architecture.
//
// Everything the visitor can open (folders, text files, case studies, the
// resume, contact links) is a node in this one tree. Finder, Spotlight, the
// command palette, the Go menu and the Terminal all read from here, so content
// is added in exactly one place.
//
// Node shape (see the workflow spec, "Folder Metadata" / "Project Metadata"):
//   id           unique, stable — used as the window key and the Go/Terminal target
//   name         label shown in Finder
//   kind         folder | text | project | pdf | mail | link | gallery
//   description  one line, shown in Get Info and the list view
//   createdAt    display string, Get Info only
//   modifiedAt   display string, Get Info only
//   children     folder only
//   body         text only — plain text, rendered in a TextEdit-style window
//   project      project only — the case-study payload
//   href         link only

import { PROJECTS_DATA } from './projectsData';

// ---------------------------------------------------------------------------
// Case studies
// ---------------------------------------------------------------------------

// The vibecoded apps already live in PROJECTS_DATA (they drive the desktop
// folder gallery too). Reshaping them here keeps one copy of that content
// instead of a second one that drifts.
function caseStudyFromProject(p) {
  return {
    title: p.title,
    category: p.category === 'vibecoded-apps' ? 'Vibecoded App' : 'Case Study',
    year: p.year,
    role: 'Idea · Design · Build',
    client: 'Self-initiated',
    description: p.tagline,
    idea: p.summary,
    execution: p.highlights || [],
    result: p.metrics,
    tags: p.tags || [],
    stack: p.techStack || [],
    links: p.demoUrl && p.demoUrl !== '#' ? [{ label: p.actionType || 'Visit', href: p.demoUrl }] : [],
    accent: p.badgeColor || '#c0392b'
  };
}

const VIBECODED = Object.fromEntries(
  PROJECTS_DATA.filter((p) => p.category === 'vibecoded-apps').map((p) => [p.id, caseStudyFromProject(p)])
);

// ---------------------------------------------------------------------------
// Small builders — they keep the tree below readable
// ---------------------------------------------------------------------------

const folder = (id, name, description, children, extra = {}) => ({
  id, name, kind: 'folder', description, children, ...extra
});

const text = (id, name, body, extra = {}) => ({
  id, name, kind: 'text', description: extra.description || 'Text file', body, ...extra
});

const project = (id, name, payload, extra = {}) => ({
  id, name, kind: 'project', description: payload.description, project: payload, ...extra
});

const link = (id, name, href, description) => ({
  id, name, kind: 'link', description, href
});

// ---------------------------------------------------------------------------
// EXPERIENCE
// ---------------------------------------------------------------------------

const EXPERIENCE = folder(
  'experience',
  'EXPERIENCE',
  'Where I have worked, and what I actually did there.',
  [
    folder('exp-emami', 'Emami', 'Brand & Creative Strategist · Feb 2026 — Present', [
      text('emami-role', 'role.txt', `EMAMI

Role:
Brand & Creative Strategist

Feb 2026 — Present

I work on AI-led creative workflows and
brand content that has to perform, not just
look good.

My work covers creative strategy, content
production, and building systems that let
good creative get made repeatedly instead
of accidentally.`),
      text('emami-responsibilities', 'responsibilities.txt', `WHAT I HANDLE

AI-led creative workflows
Creative strategy
Brand content
Performance-oriented content
AI content development
Scalable creative systems

The short version:

I figure out what to make, why it should
exist, and how to make it repeatable.`),
      folder('emami-ai-workflows', 'AI Workflows', 'Using AI as production infrastructure, not a novelty.', [
        text('emami-ai-note', 'notes.txt', `AI WORKFLOWS

AI is not the idea. AI is the speed.

Where it earns its place:

01 — Concept variations
     Twenty directions in the time one
     used to take.

02 — Script drafts
     A rough draft in minutes, so the
     time goes into the rewrite.

03 — Storyboards & mood
     Sell the idea before anyone books
     a shoot day.

04 — Repurposing
     One asset, correctly cut for every
     place it has to live.

Where it does not:

Taste. Judgement. Knowing which of the
twenty directions is the good one.`)
      ]),
      folder('emami-creative-strategy', 'Creative Strategy', 'Positioning, narrative, and the brief before the brief.', [
        text('emami-strategy-note', 'approach.txt', `CREATIVE STRATEGY

Most briefs answer "what do we make?"

The useful ones answer:

Who is this actually for?
What do they currently believe?
What should they believe instead?
What is the one idea that moves them?

Everything after that is execution.`)
      ]),
      folder('emami-campaigns', 'Campaigns', 'Brand and performance campaign work.', [
        text('emami-campaigns-note', 'overview.txt', `CAMPAIGNS

Brand content and performance content are
usually treated as different jobs.

They are the same job with different
success metrics.

Brand content earns attention.
Performance content converts it.

If the brand work is weak, the performance
work has to pay for the attention it
should have inherited.`)
      ])
    ], { createdAt: '2026', modifiedAt: 'Today', meta: { role: 'Brand & Creative Strategist', period: 'Feb 2026 — Present', status: 'Current' } }),

    folder('exp-cashkaro', 'CashKaro', 'Content & Growth Lead · Sep 2024 — Jan 2026', [
      text('cashkaro-role', 'role.txt', `CASHKARO

Role:
Content & Growth Lead

Sep 2024 — Jan 2026

I planned and created content for social
media and digital channels.

I used AI tools and workflows to support
content ideation and creative production.

I handled content from idea to production
and publishing.`),
      text('cashkaro-overview', 'overview.txt', `OVERVIEW

Owning content end to end means there is
nowhere to hide.

The idea, the script, the shoot, the edit,
the thumbnail, the caption, the publish
time, the numbers the next morning.

You learn very quickly which of your
opinions were actually correct.`),
      folder('cashkaro-youtube', 'YouTube', 'Long-form and shorts strategy.', [
        text('cashkaro-youtube-note', 'notes.txt', `YOUTUBE

The first three seconds decide whether
the other three minutes exist.

What I ended up believing:

Titles and thumbnails are the product.
The video is what keeps the promise.

A good video with a bad thumbnail is a
private video.`)
      ]),
      folder('cashkaro-social', 'Social Media', 'Daily content across channels.', [
        text('cashkaro-social-note', 'notes.txt', `SOCIAL MEDIA

Consistency beats brilliance, but only
just, and only if the consistent thing is
not boring.

The workflow that held up:

Batch the thinking.
Batch the shooting.
Never batch the judgement — check the
numbers before repeating yourself.`)
      ]),
      folder('cashkaro-campaigns', 'Campaigns', 'Campaign planning and rollout.', [
        text('cashkaro-campaigns-note', 'notes.txt', `CAMPAIGNS

A campaign is a content system with a
deadline and a budget attached.

Plan the distribution before the creative.
Otherwise you make something beautiful
that nobody has a place to put.`)
      ]),
      folder('cashkaro-strategy', 'Strategy', 'What to make and why.', [
        text('cashkaro-strategy-note', 'notes.txt', `STRATEGY

Strategy is mostly deciding what not to
make.

Every "yes" to a mediocre idea is a "no"
to the good one you did not have time
to find.`)
      ]),
      folder('cashkaro-growth', 'Growth', 'The part where the numbers matter.', [
        text('cashkaro-growth-note', 'notes.txt', `GROWTH

Growth is not a separate discipline from
content. It is the feedback loop.

Make it.
Ship it.
Read the numbers honestly.
Change the thing the numbers pointed at.
Repeat.

The hard step is the honest one.`)
      ])
    ], { createdAt: '2024', modifiedAt: 'Jan 2026', meta: { role: 'Content & Growth Lead', period: 'Sep 2024 — Jan 2026' } }),

    folder('exp-burner', 'Burner Digital', 'Content Producer and Editor · May 2022 — Feb 2024', [
      text('burner-role', 'role.txt', `BURNER DIGITAL

Role:
Content Producer and Editor

May 2022 — Feb 2024

Content strategy, YouTube content, and
end-to-end production.

Creative leadership on shoots, working
with editors and designers, and getting
things finished on a schedule that did
not negotiate.`),
      folder('burner-tech-burner', 'Tech Burner', 'Production work on one of India\'s biggest tech channels.', [
        text('burner-tech-note', 'notes.txt', `TECH BURNER

Big audience, small margin for error.

What that teaches you:

Pacing is a craft, not a preference.
The edit is where the idea actually
gets written.
"We will fix it in post" is a sentence
that costs money.`)
      ]),
      folder('burner-hog', 'House of Growth', 'Content and growth work.', [
        text('burner-hog-note', 'notes.txt', `HOUSE OF GROWTH

Growth content has to teach something
real, fast, without sounding like a
lecture.

The format matters less than whether the
viewer leaves knowing something they
did not know ninety seconds ago.`)
      ]),
      folder('burner-production', 'Content Production', 'Pre-production through delivery.', [
        text('burner-production-note', 'notes.txt', `CONTENT PRODUCTION

Pre-production is where you save the
money. Post-production is where you
spend it.

A shot list is cheaper than a reshoot.
A locked script is cheaper than a
re-record.
An honest timeline is cheaper than
all of it.`)
      ])
    ], { createdAt: '2022', modifiedAt: 'Feb 2024', meta: { role: 'Content Producer and Editor', period: 'May 2022 — Feb 2024' } }),

    folder('exp-monk', 'Monk Entertainment', 'Creative Producer · March 2024 — Aug 2024', [
      text('monk-role', 'role.txt', `MONK ENTERTAINMENT

Role:
Creative Producer

March 2024 — Aug 2024

Brand campaigns and client work.

Leading teams of designers and editors,
and turning a client brief into something
worth watching.`),
      folder('monk-brand-content', 'Brand Content', 'Content made for brands, watched by people.', [
        text('monk-brand-note', 'notes.txt', `BRAND CONTENT

The brief says "we want it to go viral".

The job is to translate that into
something specific enough to actually
make, and honest enough that people do
not scroll past it.`)
      ]),
      folder('monk-creative-production', 'Creative Production', 'Running the making of the thing.', [
        text('monk-production-note', 'notes.txt', `CREATIVE PRODUCTION

Producing is 20% creative and 80%
removing obstacles from other people's
day so the creative can happen.

Nobody puts that on a showreel. It is
still the job.`)
      ]),
      folder('monk-clients', 'Clients', 'Working with brands and their teams.', [
        text('monk-clients-note', 'notes.txt', `CLIENTS

Clients are not the enemy of good work.
Vague feedback is.

"Make it pop" means nothing.
"The first three seconds do not tell me
what this is" is feedback I can use.

Half the job is asking the question that
turns the first one into the second.`)
      ])
    ], { createdAt: '2024', modifiedAt: 'Aug 2024', meta: { role: 'Creative Producer', period: 'March 2024 — Aug 2024' } })
  ],
  { createdAt: '2022', modifiedAt: 'Today', meta: { size: '5+ years', owner: 'Ishant', status: 'Still making things.' } }
);

// ---------------------------------------------------------------------------
// WORK
// ---------------------------------------------------------------------------

const WORK = folder(
  'work',
  'WORK',
  'Selected campaigns, films, social and AI creative.',
  [
    folder('work-campaigns', 'Campaigns', 'Brand campaigns, start to finish.', [
      project('proj-zandu-good-gut', 'Zandu Good Gut', {
        title: 'Zandu Good Gut',
        category: 'Campaign',
        year: '2025',
        role: 'Creative Strategy · Production · AI',
        client: 'Zandu',
        description: 'Making gut health feel like something people talk about, not something they Google at 2am.',
        idea: 'Gut health advertising defaults to diagrams and discomfort. The opening move was to stop explaining the science and start naming the feeling — the heaviness after every meal that people had quietly accepted as normal.',
        execution: [
          'Positioned the product against a daily felt problem rather than a clinical one',
          'Built a hook matrix and tested opening lines before committing to a shoot',
          'Used AI for concept variants and storyboards so the shortlist was chosen, not settled for',
          'Cut the film into platform-native versions instead of resizing one master'
        ],
        result: 'A campaign that led with a recognisable feeling instead of a chart — and a repeatable hook-testing process the team kept using after the campaign shipped.',
        tags: ['Creative', 'AI', 'Advertising', 'Health'],
        stack: ['Creative Strategy', 'AI Storyboarding', 'Production', 'Edit'],
        accent: '#1f8a5f'
      }),
      project('proj-zandu-shilajit', 'Zandu Shilajit', {
        title: 'Zandu Shilajit',
        category: 'Campaign',
        year: '2025',
        role: 'Creative Strategy · Production',
        client: 'Zandu',
        description: 'A heritage ingredient sold to an audience that distrusts heritage claims.',
        idea: 'The category runs on borrowed authority — ancient words, mountain footage, vague promises. The bet was that specificity would out-perform mystique with an audience that fact-checks everything.',
        execution: [
          'Replaced mood-led claims with concrete, checkable ones',
          'Built the creative around sourcing and proof rather than folklore',
          'Wrote for a sceptical viewer instead of a believing one',
          'Produced a modular asset set so claims could be swapped without a reshoot'
        ],
        result: 'Creative that survived a sceptical audience because it stopped asking them to take anything on faith.',
        tags: ['Creative', 'Advertising', 'Brand'],
        stack: ['Creative Strategy', 'Production', 'Copy'],
        accent: '#8a5a1f'
      }),
      project('proj-earnkaro', 'EarnKaro', {
        title: 'EarnKaro',
        category: 'Campaign',
        year: '2025',
        role: 'Content Strategy · Production',
        client: 'EarnKaro',
        description: 'Explaining how the money actually works, without a single stock photo of a piggy bank.',
        idea: 'Fintech content usually explains the mechanism. People do not want the mechanism — they want to know whether it works for someone like them. So the content led with the person, and let the mechanism arrive second.',
        execution: [
          'Led with real user situations instead of product features',
          'Built a repeatable format so the story changed but the frame did not',
          'Shot for shorts first, then assembled the long form from the same day',
          'Wrote captions and titles as part of the creative, not as an afterthought'
        ],
        result: 'A format that could be refilled weekly without redesigning the creative every time.',
        tags: ['Content Strategy', 'Fintech', 'Social'],
        stack: ['Content Strategy', 'Production', 'Edit'],
        accent: '#2b5fa8'
      })
    ]),

    folder('work-brand-films', 'Brand Films', 'Longer form, higher stakes.', [
      project('proj-brand-films', 'Brand Film Work', {
        title: 'Brand Film Work',
        category: 'Brand Film',
        year: '2022 — 2026',
        role: 'Producer · Creative Direction · Edit',
        client: 'Various',
        description: 'Films where the brand is present but not the loudest thing in the room.',
        idea: 'A brand film fails the moment the viewer can feel it being sold to them. The craft is in earning the last ten seconds by making the first fifty worth staying for.',
        execution: [
          'Story first — brand integration decided after the story worked',
          'Ran pre-production hard so shoot days were about performance, not logistics',
          'Cut for emotional pacing rather than information order',
          'Delivered a short-form set from the same footage, cut natively rather than trimmed'
        ],
        result: 'Films that hold attention on their own terms and still do the commercial job they were commissioned for.',
        tags: ['Film', 'Production', 'Direction'],
        stack: ['Pre-production', 'Direction', 'Edit', 'Sound'],
        accent: '#2b2b2b'
      })
    ]),

    folder('work-social', 'Social', 'Daily-format content, made to survive the feed.', [
      project('proj-social-systems', 'Social Content Systems', {
        title: 'Social Content Systems',
        category: 'Social',
        year: '2024 — 2026',
        role: 'Content Strategy · Production',
        client: 'CashKaro · Various',
        description: 'Turning "post more" into a system that does not burn out the people running it.',
        idea: 'Most social plans fail on volume, not on taste. The fix is formats — reusable frames that make the weekly output a filling-in exercise instead of a blank page every Monday.',
        execution: [
          'Defined a small set of repeatable formats instead of one-off posts',
          'Batched shooting and writing so publishing was never the bottleneck',
          'Built a hook library from what had actually performed, not what sounded clever',
          'Reviewed numbers weekly and retired formats that stopped working'
        ],
        result: 'Consistent output with a fraction of the weekly decision-making, and a clear signal for what to make more of.',
        tags: ['Social', 'Systems', 'Content Strategy'],
        stack: ['Notion', 'Format Library', 'Analytics'],
        accent: '#a8237a'
      })
    ]),

    folder('work-ai-creative', 'AI Creative', 'Where the AI work meets the client work.', [
      project('proj-ai-creative', 'AI-Led Creative Production', {
        title: 'AI-Led Creative Production',
        category: 'AI Creative',
        year: '2025 — 2026',
        role: 'Creative Strategy · AI Workflow Design',
        client: 'Emami · Various',
        description: 'AI in the parts of production where it is genuinely faster, and nowhere else.',
        idea: 'The useful question is not "can AI make this?" but "which twenty minutes of this process were never the creative part?" Those are the minutes worth automating.',
        execution: [
          'Mapped the production pipeline and marked every step that was mechanical',
          'Used AI for concepting volume, script drafts, storyboards and repurposing',
          'Kept selection, taste and final craft explicitly human',
          'Documented the workflow so it survived being handed to someone else'
        ],
        result: 'Faster shortlists and cheaper pre-visualisation, with the final quality bar unchanged — because the bar was never the part being automated.',
        tags: ['AI', 'Workflow', 'Creative'],
        stack: ['Claude', 'Midjourney-class tools', 'Custom prompts', 'Notion'],
        accent: '#5b3fd4'
      })
    ]),

    folder('work-strategy', 'Strategy', 'The thinking that happens before anything gets made.', [
      project('proj-content-architecture', 'Multi-Channel Content Architecture', {
        title: 'Multi-Channel Content Architecture',
        category: 'Strategy',
        year: '2025 — 2026',
        role: 'Content Strategy · Systems Design',
        client: 'Founders & Brands',
        description: 'One weekly recording, ten channel-native pieces, no one crying on Friday.',
        idea: 'Founders do not have a content problem, they have a distribution problem. One good conversation a week is enough raw material — if there is a system that knows what to do with it.',
        execution: [
          'Designed a 3-tier editorial pipeline with status automation',
          'Built a hook-testing matrix with A/B variant tracking',
          'Created a reusable asset taxonomy so evergreen work could be reposted deliberately',
          'Handed over documentation so the system outlived my involvement'
        ],
        result: '1.4M organic views and a sharp drop in weekly production overhead.',
        tags: ['Content Strategy', 'Systems', 'Distribution'],
        stack: ['Notion', 'Make.com', 'Airtable', 'AI scripting'],
        accent: '#c0392b'
      })
    ]),

    folder('work-editing', 'Editing', 'The room where the idea gets rewritten.', [
      project('proj-editing', 'Edit Craft', {
        title: 'Edit Craft',
        category: 'Editing',
        year: '2022 — 2026',
        role: 'Editor',
        client: 'Various',
        description: 'Four years of deciding what to cut.',
        idea: 'Editing is not assembly. It is the last and most honest draft of the script — the point where you find out whether the idea actually worked.',
        execution: [
          'Cut long-form YouTube, brand films, and short-form at volume',
          'Built pacing habits around retention data instead of instinct alone',
          'Standardised project structure so handovers took minutes, not days',
          'Treated sound as half the edit, because it is'
        ],
        result: 'A cutting style that holds attention without shouting, and edits that other people could pick up without a phone call.',
        tags: ['Editing', 'Post-production', 'Craft'],
        stack: ['Premiere Pro', 'After Effects', 'DaVinci'],
        accent: '#1f6f8a'
      })
    ])
  ],
  { createdAt: '2022', modifiedAt: 'Today', meta: { size: 'Selected work', owner: 'Ishant' } }
);

// ---------------------------------------------------------------------------
// AI LAB
// ---------------------------------------------------------------------------

const AI_LAB = folder(
  'ai-lab',
  'AI LAB',
  'Things I build with AI. Some finished, some honestly not.',
  [
    project('lab-notchdrawer', 'NotchDrawer', {
      title: 'NotchDrawer',
      category: 'Product',
      year: '2025',
      role: 'Idea · Design · Build',
      client: 'Self-initiated',
      status: 'LIVE',
      description: 'A tiny Mac utility that turns the notch into somewhere useful.',
      problem: 'The notch is the one piece of screen real estate every MacBook has and nothing uses. Meanwhile the files you are actively working on live in a Downloads folder you have to go and find.',
      idea: 'Make the dead space into a shelf. Hover the notch, drop a file, keep working.',
      execution: [
        'Drag-and-drop file shelf that appears on hover over the notch',
        'Teleprompter overlay mode for recording to camera',
        'Quick clipboard history for the last things you copied',
        'Under 12MB memory footprint — it has to be invisible until wanted'
      ],
      result: 'Shipped, live, and used daily by the person most annoyed by the original problem.',
      tags: ['SwiftUI', 'AppKit', 'macOS', 'Vibecoded'],
      stack: ['SwiftUI', 'AppKit', 'Claude Code', 'macOS APIs'],
      accent: '#e5b935'
    }),

    project('lab-brainjot', 'BrainJot', {
      ...(VIBECODED['brainjot'] || {}),
      title: 'BrainJot',
      status: 'LIVE',
      problem: 'Ideas arrive as a mess. Every notes app then asks you to organise the mess before you are done having it.',
      accent: '#00a5b5'
    }),

    folder('lab-vibecoded', 'Vibe Coded Apps', 'Built fast, with AI, because the problem was annoying enough.',
      PROJECTS_DATA.filter((p) => p.category === 'vibecoded-apps').map((p) =>
        project(`lab-app-${p.id}`, p.title, {
          ...caseStudyFromProject(p),
          status: p.year === '2026' ? 'LIVE' : 'BUILDING'
        })
      )
    ),

    folder('lab-ai-experiments', 'AI Creative Experiments', 'Using AI on the creative work itself.', [
      text('lab-ai-exp-note', 'experiments.txt', `AI CREATIVE EXPERIMENTS

AI generates ad concepts
    Twenty directions from one brief.
    Two are usable. That is a good ratio.

AI storyboard generator
    Sell the idea before booking the
    shoot day.

Content automator
    The boring 40% of repurposing,
    handled.

Hook rewriting at volume
    Same idea, thirty openings, pick
    the one that survives.

None of these are products.
All of them saved real time.`)
    ]),

    folder('lab-experiments', 'Experiments', 'Curiosity, not products.', [
      text('lab-exp-list', 'experiments.txt', `EXPERIMENTS

Weird website experiments
    Including, at some point, this one.

Random UI experiments
    Interfaces that had no business
    existing.

Things that broke
    A respectable number.

The point is not that these shipped.
The point is that I keep opening the
editor to find out what happens.`)
    ]),

    folder('lab-building', "Things I'm Building", 'Currently unfinished, deliberately.', [
      text('lab-building-note', 'in-progress.txt', `THINGS I'M BUILDING

Secret project          BUILDING
    Not ready. Ask me in a month.

Experiment 04           PAUSED
    Good idea, wrong time.

This portfolio           LIVE
    You are inside it.

Building in public is easy until the
public asks for a demo.`)
    ])
  ],
  {
    createdAt: '2025',
    modifiedAt: 'Today',
    statusLine: { Projects: '06', Live: '02', Building: '02', Experiments: '02' },
    meta: { size: '6 experiments', owner: 'Ishant', status: 'Currently running.' }
  }
);

// ---------------------------------------------------------------------------
// ABOUT ME
// ---------------------------------------------------------------------------

const ABOUT = folder(
  'about-me',
  'ABOUT ME',
  'The person behind the work.',
  [
    text('about-who', 'who-am-i.txt', `WHO AM I?

I'm Ishant.

A Creative Strategist, Content Producer
and Brand Storyteller.

I help brands sound more human
and less like marketing.

My work sits somewhere between:

Content
Brand
Creative
Technology
AI
Culture

I like turning ideas into things people
can actually see, use or remember.`),

    text('about-obsessed', 'currently-obsessed-with.txt', `CURRENTLY OBSESSED WITH

AI
Psychology
Filmmaking
Design
Technology
Mathematics
Marketing
Gaming
Architecture
Building weird things

Current side quest:

Making computers do things
they probably shouldn't.`),

    text('about-likes', 'things-i-like.txt', `THINGS I LIKE

Interfaces that respect your time.
The second draft.
People who explain things simply.
Films that trust the audience.
Good typography on bad signage.
Finding out I was wrong about something.
Shipping.

THINGS I DO NOT

"Let's circle back."
Decks with no decision in them.
Content made because the calendar said so.
The word "synergy", used sincerely.`),

    text('about-how-i-work', 'how-i-work.txt', `HOW I WORK

01 — Find the interesting idea.

02 — Remove the unnecessary stuff.

03 — Make it understandable.

04 — Make it look good.

05 — Ship it.

06 — Learn what went wrong.

07 — Repeat.

Step 06 is the one most people skip.
It is the one that compounds.`),

    folder('about-camera-roll', 'camera-roll', 'Behind the scenes, mostly out of focus.', [
      text('about-camera-note', 'about-these.txt', `CAMERA ROLL

Set photos. Monitors at 2am.
Whiteboards that made sense at the time.
Coffee, in quantities best not discussed.

The polished work is in WORK.
This is what it looked like while it
was still going wrong.`)
    ])
  ],
  { createdAt: '2000', modifiedAt: 'Today', meta: { owner: 'Ishant', status: 'Still figuring it out.' } }
);

// ---------------------------------------------------------------------------
// RANDOM
// ---------------------------------------------------------------------------

const RANDOM = folder(
  'random',
  'RANDOM',
  'Not everything has to be career related.',
  [
    folder('random-music', 'music', 'What is playing while the work happens.', [
      text('random-music-note', 'now-playing.txt', `MUSIC

Editing needs music without words.
Writing needs music with words I already
know, so my brain stops listening.

Shooting needs whatever keeps the room
awake at hour nine.

There is an iPod on this desktop.
It works. Go find it.`)
    ]),

    folder('random-camera-roll', 'photography', 'Photos taken for no commercial reason at all.', [
      text('random-photo-note', 'notes.txt', `PHOTOGRAPHY

No client. No brief. No deliverable.

Which is the entire point.`)
    ]),

    folder('random-games', 'games', 'Time accounted for elsewhere.', [
      text('random-games-note', 'notes.txt', `GAMES

Games got interface design right decades
before software did.

Onboarding without a manual.
Feedback on every input.
Difficulty that respects the player.

Most apps still cannot do this.`)
    ]),

    text('random-shower-thoughts', 'shower-thoughts.txt', `SHOWER THOUGHTS

Every portfolio says "passionate".
None of them prove it.

The best ideas arrive when you are not
allowed to write them down.

Loading screens are the only honest part
of most software.

If you cannot explain the idea in one
sentence, you have two ideas.

Nobody has ever been convinced by a
buzzword. They have only been outlasted
by one.`),

    text('random-stupid-ideas', 'stupid-ideas.txt', `STUPID IDEAS

01
A dating app for people
who hate dating apps.

02
LinkedOut
A Glassdoor-style website
for people who left companies.

03
An AI that judges your startup idea.
Honestly. Out loud. In front of others.

04
A website that does absolutely nothing.
Perfect uptime. Zero bugs.

05
A notes app that deletes anything you
have not opened in a year, and is
correct to do so.`),

    text('random-want-to-build', 'things-i-want-to-build.txt', `THINGS I WANT TO BUILD

A tool that tells you which of your
ideas you have already had before.

An edit assistant that only suggests
cuts, never additions.

Something that makes reading long
documents feel like scrolling a feed,
without making it worse.

A portfolio that is also an operating
system.
    — done, you are in it`),

    folder('random-memes', 'memes', 'Folder exists. Contents classified.', [
      text('random-memes-note', 'readme.txt', `MEMES

This folder is 4.2GB.

None of it is going in a portfolio.

Some things should stay on the local
machine.`)
    ])
  ],
  { createdAt: 'Whenever', modifiedAt: 'Today', meta: { owner: 'Ishant', status: 'Unsorted, deliberately.' } }
);

// ---------------------------------------------------------------------------
// RESUME + CONTACT
// ---------------------------------------------------------------------------

const RESUME = {
  id: 'resume',
  name: 'RESUME.pdf',
  kind: 'pdf',
  description: 'The conventional version, for people who need one.',
  file: '/resume.pdf',
  preview: '/resume.jpg',
  createdAt: '2022',
  modifiedAt: 'Today'
};

const CONTACT = folder(
  'contact',
  'CONTACT',
  'The part where you get in touch.',
  [
    { id: 'contact-email', name: 'Email', kind: 'mail', description: 'Write to me without leaving the desktop.' },
    link('contact-linkedin', 'LinkedIn', 'https://linkedin.com', 'The professional one.'),
    link('contact-instagram', 'Instagram', 'https://instagram.com', 'The less professional one.'),
    link('contact-website', 'Portfolio', 'https://heyishant.com', 'This, but on a normal URL.')
  ],
  { createdAt: '2022', modifiedAt: 'Today', meta: { owner: 'Ishant', status: 'Replies within a day or two.' } }
);

// ---------------------------------------------------------------------------
// The tree
// ---------------------------------------------------------------------------

export const FILESYSTEM = [EXPERIENCE, WORK, AI_LAB, ABOUT, RANDOM, RESUME, CONTACT];

// The Finder root. Opening Finder from the Dock lands here, and it gives
// breadcrumbs somewhere to terminate.
export const HOME = folder('home', 'Home', 'Everything on this machine.', FILESYSTEM, {
  createdAt: '2022',
  modifiedAt: 'Today',
  meta: { owner: 'Ishant', status: 'Still making things.' }
});

// Shown on the desktop and in the Finder sidebar, in priority order
// (work and experience first — the fun interface must not bury the work).
export const DESKTOP_ORDER = ['work', 'experience', 'ai-lab', 'about-me', 'random', 'resume', 'contact'];

// Trash is an easter egg, not part of the real tree.
export const TRASH_ITEMS = [
  'Generic Portfolio Template',
  '"Passionate about innovation"',
  '37 rejected startup ideas',
  'My sleep schedule',
  'Corporate buzzwords',
  'A deck with no decision in it'
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

const INDEX = new Map();
const PARENTS = new Map();

(function indexTree(nodes, parentId = null) {
  for (const node of nodes) {
    INDEX.set(node.id, node);
    PARENTS.set(node.id, parentId);
    if (node.children) indexTree(node.children, node.id);
  }
})([HOME]);

export function findNode(id) {
  return INDEX.get(id) || null;
}

/** Ancestors first, then the node itself — used for the Finder breadcrumb. */
export function getPath(id) {
  const path = [];
  let current = id;
  while (current) {
    const node = INDEX.get(current);
    if (!node) break;
    path.unshift(node);
    current = PARENTS.get(current);
  }
  return path;
}

export function getParentId(id) {
  return PARENTS.get(id) ?? null;
}

/** Every node, flattened — the search corpus for Spotlight and Cmd+K. */
export function allNodes() {
  return Array.from(INDEX.values());
}

export function itemCount(node) {
  return node.children ? node.children.length : 0;
}

/** "1 item" / "4 items" — pluralised, because "1 items" reads like a bug. */
export function itemCountLabel(node) {
  const n = itemCount(node);
  return `${n} item${n === 1 ? '' : 's'}`;
}

/** Case studies in tree order, so a case-study window can offer Previous/Next. */
export const PROJECT_SEQUENCE = allNodes().filter((n) => n.kind === 'project');

export function searchNodes(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return allNodes()
    .filter((n) => n.id !== 'home')
    .filter((n) => {
      if (n.name.toLowerCase().includes(q)) return true;
      if (n.description && n.description.toLowerCase().includes(q)) return true;
      if (n.body && n.body.toLowerCase().includes(q)) return true;
      if (n.project) {
        const p = n.project;
        return [p.description, p.idea, p.result, p.client, (p.tags || []).join(' ')]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(q));
      }
      return false;
    })
    .sort((a, b) => {
      // Exact-ish name matches first, then folders, then everything else.
      const an = a.name.toLowerCase().startsWith(q) ? 0 : 1;
      const bn = b.name.toLowerCase().startsWith(q) ? 0 : 1;
      if (an !== bn) return an - bn;
      return 0;
    });
}
