import { DurableObject } from "cloudflare:workers";

export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      const data = await request.json();
      const { message, sessionId } = data;

      if (!message) {
        return new Response(JSON.stringify({ error: "Message required" }), { 
            status: 400, headers: corsHeaders 
        });
      }

      const id = env.AI_MEMORY.idFromName(sessionId || "default");
      const stub = env.AI_MEMORY.get(id);

      const newRequest = new Request(request.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data), 
      });

      const response = await stub.fetch(newRequest);
      
      const responseBody = await response.text();
      return new Response(responseBody, {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  },
};

export class ChatMemoryV3 extends DurableObject {
  constructor(state, env) {
    super(state, env);
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    try {
      const { message } = await request.json();

      let history = (await this.state.storage.get("history")) || [];

      history.push({ role: "user", content: message });

      const response = await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
        messages: [
          { role: "system", content: "You are a helpful and concise assistant." },
          ...history,
        ],
      });

      history.push({ role: "assistant", content: response.response });
      await this.state.storage.put("history", history);

      return new Response(JSON.stringify({ reply: response.response }), {
        headers: { "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ reply: "AI Error: " + err.message }), { status: 500 });
    }
  }
}