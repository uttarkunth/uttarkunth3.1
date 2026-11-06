# Uttarkunth

**Learn by Doing • Grow by Serving 💜**

[![Website](https://img.shields.io/badge/Website-uttarkunth.com-263D32?style=flat-square)](https://uttarkunth.com)
[![Platform](https://img.shields.io/badge/Platform-Himalayan%20Ecosystem-C55B23?style=flat-square)](https://uttarkunth.com)

**Uttarkunth is a Himalayan-rooted platform built around people, places, culture, and meaningful local opportunities.** We bring together stays, products, films and creative work, and community initiatives—helping people discover the Himalayas while creating ways for local communities and independent creators to participate.

This repository contains the source code for the Uttarkunth digital platform.

## About Uttarkunth

Uttarkunth is guided by a simple belief: meaningful development begins with people and grows through participation, learning, and service. Our approach is inspired by *Karmayog*—doing thoughtful work with sincerity, responsibility, and a focus on collective good.

Our long-term vision is to build a living ecosystem where visitors, residents, hosts, makers, storytellers, and collaborators can connect and contribute.

## Explore the Uttarkunth ecosystem

| Pillar | What it brings together |
|---|---|
| **[Uttarkunth Stays](https://uttarkunth.com/stays)** | Thoughtfully hosted stays and local hospitality across Himalayan destinations. |
| **Products** | Local makers, regional products, crafts, and mountain-origin goods. |
| **[Uttarkunth Productions](https://uttarkunth.com/production)** | Independent films, documentaries, stories, and creative collaborations rooted in the Himalayas. |
| **Community** | The Uttarkunth philosophy, learning, grassroots initiatives, and opportunities to participate. |

The platform is being developed in stages. Features, destinations, listings, and collaboration opportunities may evolve as the ecosystem grows.

## Our philosophy

- **Learn by doing:** Turn ideas into practical work and shared learning.
- **Grow by serving:** Measure progress by the value created for people and places.
- **Respect local knowledge:** Give space to local voices, culture, skills, and livelihoods.
- **Build responsibly:** Develop useful, transparent, and sustainable opportunities over time.

## About this repository

This is the **Uttarkunth 3.1** web application.

The project brings the public-facing Uttarkunth experience and its supporting platform services into one codebase. It is built with:

- **Next.js** and **React** for the web application
- **TypeScript** for application code
- **Tailwind CSS** for styling
- **Supabase** for authentication, database, and storage services
- **OpenNext** and **Cloudflare Workers** for deployment

The codebase is actively evolving. The repository's source code and configuration are the authoritative references for the current implementation.

## Local development

### Requirements

- Node.js (use the version configured by the project or deployment environment)
- npm
- Access to a configured Supabase project for features that require backend services

### Setup

```bash
git clone https://github.com/uttarkunth/uttarkunth3.1.git
cd uttarkunth3.1
npm install
```

Create a local environment file from the example:

```bash
cp .env.example .env.local
```

Add the required values to `.env.local`. Keep real credentials and secrets out of Git.

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Useful project commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start the local development server |
| `npm run lint` | Run lint checks |
| `npm test` | Run the automated test suite |
| `npm run build` | Build the Next.js application |
| `npm run build:worker` | Build the Cloudflare Workers output |
| `npm run preview` | Build and preview the Worker locally |
| `npm run deploy` | Build and deploy using the configured Wrangler environment |

Deployment requires the appropriate Cloudflare and Supabase configuration. Do not commit API keys, service-role credentials, access tokens, or private environment files.

## Project documentation

Technical and operational documentation is maintained separately from this public introduction:

- [Deployment guide](DEPLOYMENT.md)
- [Master technical reference](docs/CHATGPT_MASTER_REFERENCE.md)
- [Codebase comparison](docs/audit/CODEBASE_COMPARISON.md)
- [Security remediation notes](docs/security/SECURITY_REMEDIATION.md)
- [Database and migration review](docs/database/MIGRATION_REVIEW.md)
- [Testing report](docs/testing/FINAL_TEST_REPORT.md)

Some documents describe implementation and review history; check the current source code and migration status before relying on any historical status statement.

## Contributing and collaboration

We welcome thoughtful collaboration from people who care about the Himalayas, responsible technology, local livelihoods, culture, and community-led development.

Before proposing a change:

1. Explain the problem or opportunity clearly.
2. Keep changes focused and avoid unrelated rewrites.
3. Do not include private data, credentials, guest information, or confidential business records in issues or pull requests.
4. Include relevant tests or verification steps when changing application behaviour.

For general information and collaboration enquiries, visit [uttarkunth.com](https://uttarkunth.com).

---

**Uttarkunth**  
*Ideas born in the mountains. Built through people.*  
[uttarkunth.com](https://uttarkunth.com)
