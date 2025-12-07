# cf_ai_AS
Cloudflare assignment 

### How to preview
[https://cf-ai-as.pages.dev]

### Brief structure description
1.  LLM used: `@cf/meta/llama-3.1-8b-instruct`
2.  Coordination (Workers): handles HTTP requests, CORS policies, and routing
3.  Memory & State:
    * maintains state across multiple requests
    * ensures that the AI has the full context of the conversation before generating a reply.
4.  Frontend: HTML/JS interface hosted on Cloudflare Pages.
