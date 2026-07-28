# Bhasha SQL

A multi-language Natural Language → SQL assistant powered by Claude.
Comes preloaded with **119 database schemas** (e-commerce, banking, hospital, school, airline, and many more) or you can paste your own.

- Ask questions in **any language** (Tamil, Hindi, English, etc.)
- Generates safe, read-only SQLite `SELECT` queries only (blocks INSERT/UPDATE/DELETE/DROP/etc.)
- Saves your query history locally in the browser
- Simple Express backend keeps your Anthropic API key private

## Project structure

```
bhasha-sql/
├── server.js          # Express backend — calls the Anthropic API
├── src/
│   ├── App.jsx         # Main React UI
│   ├── main.jsx         # React entry point
│   └── schemas.js       # 119 built-in database schemas
├── index.html
├── package.json
├── vite.config.js
└── .env.example
```

## Setup

1. **Clone and install dependencies**
   ```bash
   git clone <your-repo-url>
   cd bhasha-sql
   npm install
   ```

2. **Add your Anthropic API key**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and paste your key:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
   ```
   Get a key from [console.anthropic.com](https://console.anthropic.com).

3. **Run the backend** (in one terminal)
   ```bash
   npm run server
   ```

4. **Run the frontend** (in another terminal)
   ```bash
   npm run dev
   ```

5. Open the printed local URL (usually `http://localhost:5173`) in your browser.

## How it works

1. Pick a database from the 119 built-in schemas, or paste your own `CREATE TABLE` statements.
2. Type a question in any language.
3. The frontend sends `{ question, schema }` to `POST /api/generate-sql` on the backend.
4. The backend calls the Anthropic API with a system prompt instructing the model to return only SQLite `SELECT` queries as structured JSON.
5. The backend double-checks the returned SQL and blocks it if it isn't a safe `SELECT` statement, then returns the result to the frontend.

## Notes

- This tool only **generates** SQL text — it does not connect to or execute queries against a real database.
- Never commit your `.env` file or hardcode your API key in frontend code.
- To add more databases, edit `src/schemas.js`.
