import { tavily } from "@tavily/core";
import express from "express";
import { createOpenAI } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";
import { PROMT, SYSTEM_PROMT } from "./promt.js";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const app = express();
app.use(express.json()); // Essential for parsing req.body!

// Initialize Cloudflare Workers AI via OpenAI compatibility layer
const cloudflare = createOpenAI({
    baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
    apiKey: process.env.CLOUDFLARE_API_TOKEN,
});


//signup
app.post("/signup",async(req,res)=>{
    
})

//signIn

app.post("/signin",async(req,res)=>{
    
})


//past conversation get

app.get("/conversations",async(req,res)=>{
    
})

//past conversation id get

app.get("/conversations/:conversation_id",async(req,res)=>{
    
})

app.post("/pawrplexity_ask", async (req, res) => {

    //Step 1  get the query from the user 

    const query = req.body.query; //give me the best rust resources => rust resources


    // Step 2 - make sure user has access/credits to hit the endpoint 

    //Step 3 (TODO) - check if we have a web search indexed for a similar query 

    //Step 4- web search gather resources
    const webSearchResponse = await client.search(query, {
        searchDepth: "advanced"
    });

    const webSearchResults = webSearchResponse.results;


    //Step 5 - do some context engineering on the prompt + web search results 
    const prompt = PROMT
        .replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults))
        .replace("{{USER_QUERY}}", query);

    //Step 6 - hit the LLM and stream back the response
    const result = streamObject({
        model: cloudflare.chat("@cf/meta/llama-3.1-8b-instruct"), // Llama 3.1 supports structured outputs
        prompt: prompt,
        system: SYSTEM_PROMT,
        schema: z.object({
            answer: z.string(),
            followUps: z.array(z.string()),
        })
    });
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");

    for await (const textPart of result.textStream) {
        res.write(textPart);
    }

    res.write("\n<SOURCES>\n");

    //Step 7 - also stream back the sources and follow up questions

    res.write(JSON.stringify(webSearchResults.map(result => ({ url: result.url }))));

    res.write("\n</SOURCES>\n")

    //Step 8 - close the event stream (handled automatically by pipeTextStreamToResponse)
    res.end();
});


app.post("/pawrplexity_ask/follow_up", async (req, res) => {

    //STEP 1 - get the existing chat from the db
    //STEP 2 - Forward the whole history to the LLM
    //STEP 2.5 - TODO: Do contect engineering here
    //STEP 3 - Stream the response to the user

});

app.listen(3000);