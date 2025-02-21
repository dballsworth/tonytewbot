import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "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",
});

const completion = openai.chat.completions.create({
  model: "gpt-4o-mini",
  store: true,
  messages: [
    {"role": "user", "content": "write a haiku about ai"},
  ],
});

completion.then((result) => console.log(result.choices[0].message));