# LLM / AI Search Query Builder

LLM Query Builder analyzes a website and creates service-specific queries that potential customers may ask AI assistants and AI-powered search engines.

Instead of producing generic industry keywords, the tool reviews the submitted domain's:

- Homepage
- Feature or service page
- Pricing or plans page

It uses this evidence to generate natural-language queries connected to the company's actual services, capabilities, audiences, use cases, and purchasing considerations.

## Why prompt creation matters for AI visibility tracking

AI visibility tracking starts with the prompts being monitored. A tracking platform can only measure the questions it is given, so generic prompts produce generic data.

For example, tracking a broad prompt such as:

> What is the best marketing software?

may measure a large market, but it does not reveal whether a company is visible for the services it actually sells.

A more useful tracking set includes questions such as:

- How can I track brand citations across AI search platforms?
- Which tools compare a brand's AI visibility with competitors?
- How do I identify content gaps that reduce AI citations?
- What is included in an entry-level AI visibility plan?

These prompts are valuable because each one maps to a real customer problem, feature, use case, or buying decision.

### Good tracking prompts help teams:

1. **Measure service-level visibility**  
   Determine whether AI systems mention the brand for its actual products and capabilities, not merely its broad industry.

2. **Track the customer journey**  
   Cover informational, commercial, and transactional questions—from understanding a problem to comparing solutions and evaluating plans.

3. **Find citation and content gaps**  
   Identify important questions where competitors appear but the tracked brand does not.

4. **Monitor the right audiences**  
   Build prompts around the needs and language of the people most likely to buy or recommend the service.

5. **Create an actionable baseline**  
   Reuse a stable, intentional prompt set over time to measure changes in mentions, citations, sentiment, and competitive position.

## How this tool creates grounded prompts

The analysis pipeline:

1. Fetches the submitted homepage.
2. Discovers and reads relevant same-domain feature/service and pricing pages.
3. Extracts concrete products, features, use cases, audiences, and plan details.
4. Maps those findings to customer pain points, jobs-to-be-done, goals, and personas.
5. Generates at least 100 natural search queries across the customer journey.
6. Removes duplicates and filters unwanted brand references from non-branded queries.

The crawled pages are treated as the source of truth. The generation instructions explicitly prohibit inventing unsupported services, integrations, prices, plans, trials, limits, or discounts.

## Recommended tracking coverage

A useful prompt set should include:

- Problem and pain-point questions
- Goal and outcome questions
- Task and how-to questions
- Feature and capability questions
- Solution-type comparisons
- Pricing, plan, and purchase questions supported by the website
- A small, separate set of branded questions

Prompts should be reviewed whenever the website's services, positioning, audiences, or pricing change. This keeps AI visibility reporting aligned with what the business currently offers.

## Run locally

```bash
npm install
npm run dev
```

The application runs on port `5000`.

## Production build

```bash
npm run build
npm start
```

## Environment variables

The application uses the Replit-managed OpenAI integration:

- `AI_INTEGRATIONS_OPENAI_API_KEY`
- `AI_INTEGRATIONS_OPENAI_BASE_URL`

Store credentials in Replit Secrets. Never commit secret values to source control.