import {tavily} from "@tavily/core";
import express from "express";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const app = express();

app.post("/conversation", async (req, res) => {

    //Step 1  get the query from the user 

    const query = req.body.query;

 
    // Step 2 - make sure user has access/credits to hit the endpoint 

    //Step 3 (TODO) - check if we have a web search indexed for a similar query 

    //Step 4- web search gather resources

    //Step 5 - do some context engineering on the prompt + web search results 

    //Step 6 - hit the LLM and stream back the response

    //Step 7 - also stream back the sources and follow up questions

    //Step 8 - close the event stream   
});

app.listen(3000);
