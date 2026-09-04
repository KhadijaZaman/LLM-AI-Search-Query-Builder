# LLM Query Builder

## Overview
An AI-powered market intelligence tool that generates 100+ natural, brand-free search queries optimized for LLM visibility. Takes a domain/brand URL and target region as input, runs a 9-step AI analysis pipeline, and exports results as CSV.

## Recent Changes
- 2026-01-14: Removed TRENDS step - pipeline now has 9 steps (QUERIES is step 9)
- 2026-01-14: Initial build - Complete frontend and backend implementation
- Frontend: Header with region selector, domain input, 9-step progress stepper, analysis results panels, query list with intent badges
- Backend: AI service with 9 prompts, web crawler, brand filtering logic
- Typography: IBM Plex Sans (Carbon Design System aesthetic)

## Architecture

### Frontend (client/src/)
- **Pages**: `pages/home.tsx` - Main application page
- **Components**:
  - `header.tsx` - Header with region selector, export button, theme toggle
  - `domain-input.tsx` - URL input form with validation
  - `progress-stepper.tsx` - 9-step analysis progress visualization
  - `analysis-results.tsx` - Collapsible panels for domain overview, entities, pain points, personas
  - `query-list.tsx` - Filterable list of generated queries with intent badges
  - `empty-state.tsx` - Welcome state with feature overview
  - `theme-toggle.tsx` - Dark/light mode toggle
- **State Management**: TanStack Query for server state, React useState for local state
- **Routing**: wouter

### Backend (server/)
- **Storage**: `storage.ts` - In-memory storage (MemStorage)
- **AI Service**: `ai-service.ts` + `ai-prompts.ts` - OpenAI GPT-4o-mini integration
- **Web Crawler**: `web-crawler.ts` - Basic HTML parsing for domain analysis
- **SERP News**: `serp-news-service.ts` - Google News insights (optional)
- **Brand Filter**: `brand-filter.ts` - Removes brand names from queries, deduplication
- **Routes**: `routes.ts` - API endpoints with SSE progress streaming

### Shared (shared/)
- `schema.ts` - TypeScript types and Zod schemas for all data models

## API Endpoints
- `POST /api/analysis` - Start new analysis (body: { domain, region })
- `GET /api/analysis/:id` - Get analysis by ID
- `GET /api/analysis/:id/progress` - SSE stream for real-time progress
- `GET /api/analysis` - List all analyses
- `DELETE /api/analysis/:id` - Delete analysis

## Key Features
1. **11 Supported Regions**: US, UK, UAE, Saudi Arabia, India, Australia, Germany, France, Canada, Singapore, Switzerland
2. **9-Step Analysis Pipeline**: Web Crawl → Domain Analysis → Entity Extraction → Semantic Expansion → Knowledge Graph → Pain Points → JTBD → Goals → Personas → Query Generation
3. **Query Distribution**: 95% generic (brand-free) + 5% branded queries
4. **Intent Classification**: Informational, Commercial, Transactional
5. **CSV Export**: query, topic, intent, country_iso_code

## Environment Variables
- `AI_INTEGRATIONS_OPENAI_API_KEY` - Replit AI Integration (auto-configured)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - Replit AI Integration endpoint
- `SERPAPI_KEY` (optional) - For Google News insights
- `SESSION_SECRET` - Session management

## User Preferences
- Design: Carbon Design System (IBM) aesthetic with IBM Plex Sans typography
- No emojis in UI (except for region flags in selector)
- Clean, enterprise-focused interface
