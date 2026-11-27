// Preview builds set NEXT_PUBLIC_DRAFT=1 (it's on in `npm run dev` via .env.development).
// Draft notes show what content is still missing; the live site never shows them.
export const IS_DRAFT = process.env.NEXT_PUBLIC_DRAFT === '1';
