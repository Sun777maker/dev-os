---
name: second-brain
description: >
  Builds a Company Second Brain — a structured, cross-linked Markdown wiki — from data
  living in Snowflake, fetched via the Composio MCP Snowflake connector. Discovers
  databases, schemas, and tables (never assumes names), loads every row, builds an
  internal knowledge graph, then writes a `company-second-brain/` wiki (pages, index.md,
  log.md, schema.md) into the user's current working directory. ALWAYS trigger for:
  "build the wiki", "build my second brain", "create the company wiki", "generate wiki
  from Snowflake", "turn Snowflake data into a wiki", "update the wiki", "refresh the
  second brain", or any request to turn Snowflake analytics/feedback tables into a
  persistent knowledge base. Also trigger when the user references
  `company-second-brain/`, `schema.md`, `index.md`, or asks to query/rebuild a wiki that
  was built this way.
---

# Company Second Brain — Wiki Builder

You are building a persistent, LLM-navigable knowledge base ("Second Brain") from
structured data sitting in Snowflake. You are NOT summarizing data into a one-off report
— you are creating files on disk that will be read by future Claude sessions. Follow the
phases below in strict order. **Do not skip the plan step.**

**Output location:** the wiki is always created inside the user's **current working
directory**, in a folder called `company-second-brain/`. Never write it anywhere else
unless the user explicitly gives a different path.

---

## Phase 1 — Connect & Discover the Database

- Use the Composio MCP Server to fetch the data from Snowflake.
- Discover all available databases.
- Show the list of databases to the user.
- Ask the user which database they want to use.
- Do not automatically select a database unless the user has already specified one.
- If the Snowflake connection fails, tell the user to reconnect the Composio Snowflake
  integration.
- Never fabricate data.

## Phase 2 — Discover the Database Structure

- Discover all schemas in the selected database.
- If there is only one schema, use it automatically.
- If there are multiple schemas, ask the user which one to use.
- Discover all tables in the selected schema.
- Never assume table names.
- Never filter tables based on naming.
- Treat every table as potentially useful.

## Phase 3 — Fetch the Data

- Fetch all rows from every discovered table.
- Do not sample the data.
- If one table fails, skip it and continue.
- Report the number of rows loaded from each table before moving to the next phase.

## Phase 4 — Understand the Data

- Analyze every table before creating the wiki.
- Identify entities.
- Identify relationships.
- Identify metrics.
- Identify dates.
- Identify repeated values.
- Understand how the tables are connected.
- Build an internal knowledge graph before generating the wiki.

## Phase 5 — Plan the Wiki

- Check whether `company-second-brain/` already exists.
- If it exists, read `schema.md`, `index.md`, and `log.md` first.
- Never overwrite the existing wiki.
- Only add or update pages.
- Build a short plan before writing any files.
- Wait for user approval unless they have already said to continue.

## Phase 6 — Build the Wiki

- Create the `company-second-brain/` folder in the current working directory.
- Create the folder structure based on the discovered data.
- Do not use a fixed folder structure.
- Create folders only when they make sense for the data.
- Create pages for important entities.
- Create analytics pages only if analytics data exists.
- Cross-link related pages.
- Create `index.md`.
- Create `log.md`.
- Create `schema.md` only on the first build.

## Phase 7 — Update an Existing Wiki

- Never delete existing pages.
- Detect new tables.
- Detect removed tables.
- Detect schema changes.
- Update only the affected pages.
- Preserve existing content whenever possible.

## Phase 8 — Final Response

- Report which database was used.
- Report which schema was used.
- Report the tables processed.
- Report the pages created.
- Report the pages updated.
- Report anything that was skipped.
- Remind the user that they can point Claude to `company-second-brain/` to ask questions
  about the data.

---

## Standing Rules

- Never hardcode database names.
- Never hardcode schema names.
- Never hardcode table names.
- Never hardcode folder names.
- Never assume a business domain.
- Always discover first.
- Always understand the data before writing.
- Always adapt the wiki to the data.
- Always preserve existing work.
- Never fabricate missing data.
