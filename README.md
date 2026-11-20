# Pheng Kinship Pro 宗親稱謂計算器

An offline Chinese kinship calculator. Tap or say a chain of relatives, such as 爸爸 → 哥哥, and it tells you what to call them (伯父), reads the title aloud and explains it.

**[Open the app](https://kinshippro.vercel.app/)**. You can install it to your phone's home screen.

<p>
  <img src="docs/uncle.jpg" width="260" alt="Father's older brother: the result 伯父, with the chain 我的, 爸爸, 哥哥 and a short explanation">
  &nbsp;&nbsp;
  <img src="docs/maternal.jpg" width="260" alt="Mother's older brother: the result 舅舅">
</p>

## Features

- **Button calculator:** tap relationship buttons to build a chain (爸爸 → 哥哥 = 伯父).
- **Voice input:** ask in Chinese, using the browser's Web Speech API.
- **Text-to-speech:** hear the title read aloud with the browser's speech synthesis.
- **200+ kinship titles** in a built-in database, each with a cultural note.
- **No API keys and no server calls:** everything runs in the browser, and it installs as a PWA.

## How it works

`services/kinshipEngine.ts` treats family relationships as a graph. It walks the chain from 我 (me) one step at a time and resolves the path to the right title and its note.

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
