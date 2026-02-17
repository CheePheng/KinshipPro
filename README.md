# Pheng Kinship Pro 宗親稱謂計算器

A beautiful, offline Chinese kinship title calculator. No API keys needed!

## Features

- **Button Calculator**: Tap relationship buttons to build a chain (e.g., 爸爸 → 哥哥 = 伯父)
- **Voice Recognition**: Speak naturally in Chinese to ask about relationships (uses browser Web Speech API)
- **Text-to-Speech**: Hear the result read aloud (uses browser Speech Synthesis)
- **200+ Kinship Titles**: Comprehensive offline database of Chinese kinship terms with cultural explanations
- **PWA Ready**: Installable as a mobile app
- **100% Offline**: No API keys, no server calls, works completely client-side

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Click **Deploy** — no environment variables needed!

Or use the Vercel CLI:
```bash
npm i -g vercel
vercel
```

## Local Development

```bash
npm install
npm run dev
```

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS (via CDN)
- Web Speech API (voice recognition + TTS)
- No external API dependencies
