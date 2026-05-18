import { tavily } from "@tavily/core";
import express from "express";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { z } from "zod";
import { PROMT, SYSTEM_PROMT } from "./promt.js";
import { prisma } from "./db.js";
import { middleware } from "./middleware.js";
import cors from "cors";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const app = express();
app.use(express.json()); // Essential for parsing req.body!
app.use(cors());

// Initialize Cloudflare Workers AI via OpenAI compatibility layer
const cloudflare = createOpenAI({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
    apiKey: process.env.CLOUDFLARE_API_TOKEN,
});

// Fetch all conversations for the authenticated user
app.get("/conversations", middleware, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const conversations = await prisma.conversation.findMany({
            where: { userId },
            orderBy: { id: "desc" }
        });
        res.json(conversations);
    } catch (error) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// Fetch a specific conversation along with its messages
app.get("/conversations/:conversation_id", middleware, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { conversation_id } = req.params;

        const conversation = await prisma.conversation.findFirst({
            where: { id: conversation_id as string, userId },
            include: { messages: { orderBy: { createdAt: "asc" } } }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }
        res.json(conversation);
    } catch (error) {
        console.error("Error fetching conversation details:", error);
        res.status(500).json({ error: "Failed to fetch conversation details" });
    }
});

// Create a new conversation and stream the first AI response
app.post("/pawrplexity_ask", middleware, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const query = req.body.query;

        if (!query) {
            return res.status(400).json({ error: "Query is required" });
        }

        // Initialize a new conversation with the user's query
        const slug = query.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 50);
        const uniqueSlug = `${slug}-${Date.now()}`;

        const conversation = await prisma.conversation.create({
            data: {
                title: query.substring(0, 50),
                slug: uniqueSlug,
                userId: userId,
                messages: {
                    create: { content: query, role: "User" }
                }
            }
        });

        // Expose the conversation ID so the client can continue the chat
        res.setHeader("x-conversation-id", conversation.id);
        res.setHeader("Access-Control-Expose-Headers", "x-conversation-id");
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");

        res.write("Searching the web for: " + query + "...\n\n");

        // Gather context via web search
        const webSearchResponse = await client.search(query, { searchDepth: "advanced" });
        const webSearchResults = webSearchResponse.results;

        res.write("Synthesizing sources and thinking...\n\n");

        // Context engineering with prompt
        const prompt = PROMT
            .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
            .replace("{{USER_QUERY}}", query);

        // Stream the LLM response
        const result = streamText({
            model: cloudflare.chat("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
            prompt: prompt,
            system: SYSTEM_PROMT,
        });

        let assistantResponse = "";
        for await (const textPart of result.textStream) {
            assistantResponse += textPart;
            res.write(textPart);
        }

        console.log("\n--- RAW LLM RESPONSE ---\n", assistantResponse, "\n---END---\n");
        res.write("\n<SOURCES>\n");
        res.write(JSON.stringify(webSearchResults.map(result => ({ url: result.url }))));
        res.write("\n</SOURCES>\n");

        // Save the assistant's complete response to the database
        await prisma.message.create({
            data: { content: assistantResponse, role: "Assistant", conversationId: conversation.id }
        });

        res.end();
    } catch (error) {
        console.error("Error in /pawrplexity_ask:", error);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
        else res.end();
    }
});

// Follow-up on an existing conversation
app.post("/pawrplexity_ask/follow_up", middleware, async (req, res) => {
    try {
        const userId = (req as any).userId;
        const { conversationId, query } = req.body;

        if (!conversationId || !query) {
            return res.status(400).json({ error: "conversationId and query are required" });
        }

        // Validate conversation ownership and retrieve history
        const conversation = await prisma.conversation.findFirst({
            where: { id: conversationId, userId },
            include: { messages: { orderBy: { createdAt: "asc" } } }
        });

        if (!conversation) {
            return res.status(404).json({ error: "Conversation not found" });
        }

        // Save the user's follow-up question
        await prisma.message.create({
            data: { content: query, role: "User", conversationId }
        });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");

        // Build proper messages array for chat history context
        const chatHistory = conversation.messages.map(m => ({
            role: m.role === "User" ? "user" : "assistant" as "user" | "assistant",
            content: m.content,
        }));

        // For web search, use the conversation's original topic rather than vague follow-ups like "tell me more"
        const isVagueQuery = query.trim().split(/\s+/).length < 6 || 
            /^(tell|explain|more|elaborate|what about|how about|why|continue|go on)/i.test(query.trim());
        
        // If vague, enrich the search by prepending the original conversation topic
        const searchQuery = isVagueQuery
            ? `${conversation.title} - ${query}`
            : query;

        res.write(`Searching for context: ${conversation.title}...\n\n`);

        const webSearchResponse = await client.search(searchQuery, { searchDepth: "advanced" });
        const webSearchResults = webSearchResponse.results;

        res.write("Analyzing conversation and synthesizing sources...\n\n");

        // Stream the LLM response with full conversation history as proper chat messages
        const result = streamText({
            model: cloudflare.chat("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
            system: SYSTEM_PROMT,
            messages: [
                // Inject the web search context as the first system-level context
                ...chatHistory,
                {
                    role: "user",
                    content: `WEB SEARCH CONTEXT (use if relevant):\n${JSON.stringify(webSearchResults.slice(0, 5))}\n\nUSER FOLLOW-UP: ${query}`,
                }
            ],
        });

        let assistantResponse = "";
        for await (const textPart of result.textStream) {
            assistantResponse += textPart;
            res.write(textPart);
        }

        res.write("\n<SOURCES>\n");
        res.write(JSON.stringify(webSearchResults.map(result => ({ url: result.url }))));
        res.write("\n</SOURCES>\n");

        // Save the assistant's follow-up response to the database
        await prisma.message.create({
            data: { content: assistantResponse, role: "Assistant", conversationId }
        });

        res.end();
    } catch (error) {
        console.error("Error in /pawrplexity_ask/follow_up:", error);
        if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
        else res.end();
    }
});

app.listen(3001, () => {
    console.log("Server listening on port 3001");
});