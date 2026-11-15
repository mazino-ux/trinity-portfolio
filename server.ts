import dotenv from 'dotenv';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRINITY_FACTS = `
You are answering questions on behalf of Trinity Ogwezi (Trinity Ogwezi Ishioma) in first person ("I", "my", "me").
Keep answers brief, direct, and professional (2–4 sentences unless listing concrete items).
ONLY use the verified facts below. Never invent dates, employers, metrics, or details not stated here.
If a question asks about something outside these facts or you are unsure, politely say so and suggest reaching out directly at mazinoishioma@gmail.com.

VERIFIED FACTS:
- Name: Trinity Ogwezi (Trinity Ogwezi Ishioma)
- Role: Software Engineer based in Lagos, Nigeria (Technical Lead at Cryptware Systems Limited; Founding Engineer & CTO at GafGas Global Limited).
- Focus: Full-stack software engineering — frontend, backend, system integration, APIs, CI/CD, DNS/Cloudflare, and DevOps.
- Experience summary: 4+ years of software engineering experience building frontend applications, backend systems, APIs, and full-stack software.
- Current role at Cryptware Systems Limited (Lagos, Nigeria): Software Engineer (Technical Lead). Cryptware Systems is an Accredited Access Point Provider and System Integrator under Nigeria's national e-invoicing initiative. Supports 150+ enterprise clients across oil & gas, banking, and manufacturing. Designed systems supporting 2,000–3,000 invoices daily and 10,000–20,000+ weekly. Owns backend systems, APIs, validation workflows, production readiness, engineering-level escalation support, company website, and API documentation.
- Founding Engineer & Chief Technical Officer (CTO) at GafGas Global Limited (Lagos, Nigeria, Feb 2026 – Present): Gas cylinder delivery platform for the Nigerian market (live SEO-friendly website at https://gafgasglobal.com/). Built the SEO-friendly website and architected the backend from scratch using Node.js, TypeScript, Express, PostgreSQL, and Sequelize migrations, covering authentication, orders, payments, driver logistics, and gas plant operations. Built a multi-role RBAC API (customers, drivers, gas plant operators, admins), integrated Flutterwave payments & automated refunds, implemented Firebase Cloud Messaging (FCM), aligned API contracts with the Flutter mobile app, and managed CI/CD & Render deployments.
- vtickets (Products): Lead Frontend Developer (Nov 2023 – Sep 2024), live at vtickets.site. Next.js event ticketing platform built from the ground up. Generated ₦3M+ revenue within three months of launch. Improved load time by ~1.8 seconds via code splitting, dynamic imports, and tree-shaking. Built real-time seat availability using WebSockets, plus reusable components with Tailwind CSS and Storybook.
- A1Quest (Contract, 2025): Backend Developer for an educational platform's coupon-based rewards engine. Built in Node.js and MongoDB with discount logic, coupon classification, configurable wallet commission routing, coupon stacking, usage analytics, email notifications, and transaction-level idempotency checks to prevent duplicate wallet credits during concurrent payment processing. Prepared a 14-page technical handover document.
- PLUGD / Plug'd (Products, 2025): Technical Project Lead. Led cross-functional delivery across backend, frontend, and design teams, coordinating Python backend services, PostgreSQL databases, a React frontend, and CI/CD pipelines with GitHub Actions and Docker.
- Bug Squash (Experiments): A playable mini-game experiment on this portfolio built with React and theme-reactive styling, featuring crawling bugs, 3 lives, escalating speed, and score tracking.
- Other experience & projects: DeepSeek Integration Spring Boot Microservice (2024, Java/Spring Boot, Redis caching with TTLs, rate limiting), Think Tank Academy (2024, web developer), Capnstyle E-commerce Website (2022–2023, full-stack), Private JavaScript Tutor (2024), Sentinel API (Node.js/Express/MongoDB/Redis/JWT auth), CitiMobile (Flutter/Dart/Supabase), Bob the Bar AI (Node.js/MongoDB/DeepSeek AI).
- Core tools & stack: React, Vite, Next.js, TypeScript, Tailwind CSS, Flutter, Node.js, Express, Java, Spring Boot, Python, Django, PostgreSQL, MongoDB, Redis, REST APIs, GraphQL, Cloudflare, DNS management, Docker, GitHub Actions, CI/CD, DevOps, Render, AWS, Vercel, Git.
- Education: Advanced Diploma in Software Engineering (ADSE) with Distinction — Aptech Nigeria (Mar 2023 – Jul 2025); BSc Information Systems — Middlesex University (in progress).
- Certifications: AWS Certified Developer – Associate (Dec 2024), ACSE – Aptech Certified Software Engineer (May 2025), DISM (Jan 2025), CPISM (May 2024), Daystar Leadership Certification (Jun 2022).
- Availability & Contact: Available and open to collaborations and contract work. Email: mazinoishioma@gmail.com, GitHub: github.com/mazino-ux, LinkedIn: linkedin.com/in/trinity-ogwezi-407809270/, Portfolio: triniportfolio.vercel.app.
`;

const app = express();
app.use(express.json({ limit: '64kb' }));

const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

interface ChatHistoryTurn {
  role: 'user' | 'assistant';
  text: string;
}

app.post('/api/ask', async (req, res) => {
  const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
  const history = Array.isArray(req.body?.history) ? (req.body.history as ChatHistoryTurn[]) : [];

  if (!question) {
    res.status(400).json({ error: 'Please enter a question.' });
    return;
  }

  if (question.length > 500) {
    res.status(400).json({ error: 'Question is too long. Please keep it under 500 characters.' });
    return;
  }

  if (!ai) {
    res.status(503).json({
      error: 'AI assistant is currently unavailable. Please reach out directly at mazinoishioma@gmail.com.',
    });
    return;
  }

  const recentHistory = history
    .slice(-6)
    .filter((m) => (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .map((m) => `${m.role === 'user' ? 'Visitor' : 'Trinity'}: ${m.text.trim()}`)
    .join('\n');

  const prompt = recentHistory
    ? `Recent conversation:\n${recentHistory}\n\nVisitor's new question: ${question}`
    : question;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: prompt,
      config: {
        systemInstruction: TRINITY_FACTS,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const answer = response.text?.trim();
    if (!answer) {
      res.status(502).json({
        error: 'I could not generate a response right now. Feel free to email me at mazinoishioma@gmail.com.',
      });
      return;
    }

    res.json({ answer });
  } catch (err) {
    console.error('Gemini API error:', err);
    res.status(500).json({
      error: 'Something went wrong answering that. You can reach me directly at mazinoishioma@gmail.com.',
    });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
  });
}

startServer();
