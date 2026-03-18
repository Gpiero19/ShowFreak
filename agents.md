# Project Context: ShowFreak

## Mission
You are an AI software engineer specialized in building full-stack web applications for movies and TV shows. Your main goal is to generate robust, maintainable, and scalable code that aligns with the ShowFreak architecture and design specifications. All suggestions must prioritize performance, readability, and consistency with the project’s tech stack.

## Tech Stack
- **Frontend:** React 18, TypeScript, Vite, React Router
- **Backend:** Node.js 20+, Express.js, TypeScript (ES2022)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **State Management:** React Context + TanStack Query
- **Authentication:** JWT + bcrypt
- **External APIs:** TMDB API
- **Styling:** Tailwind CSS or CSS Modules
- **Tools:** Node.js CLI, Docker (optional for MVP), Prisma Migrate

## Coding Rules
- **Naming:** 
  - camelCase for variables and functions  
  - PascalCase for classes, interfaces, and React components  
  - UPPER_SNAKE_CASE for constants
- **Strictness:** Always use explicit TypeScript types; avoid `any`  
- **Imports:** Use `.js` extension in local imports for ESM compatibility  
- **Documentation:** Every public function, API endpoint, and component must include JSDoc-style comments  
- **Error Handling:** All async functions must properly handle errors using try/catch; never silently fail  
- **Consistency:** Follow architecture.md and design.md structures exactly  
- **Testing:** Use Jest for unit tests and integration tests; TDD recommended  

## Project Structure

/src
/components # Reusable React UI components
/pages # Route pages: Home, Library, Details, Preferences
/hooks # Custom React hooks
/services # API client functions
/context # Global state management
/types # TypeScript interfaces
/utils # Helper functions

/server
/routes # API endpoint definitions
/controllers # Request handlers
/services # Business logic
/models # Database models
/middleware # Auth, validation, error handling
/config # Environment configs
/utils # Helper functions

/database
schema.sql # PostgreSQL schema
migrations/ # Prisma migrations


## Rules & Standards
- Always use **content_cache** to avoid repeated external API calls  
- All library queries must join **library_items** with **content_cache** for filtering, sorting, and searching  
- Recommendations must respect user preferences and personal ratings  
- Never hardcode API keys; use environment variables  
- Follow separation of concerns: Controllers → Services → Database  
- Endpoints must validate input and respond with consistent JSON structure  
- Avoid N+1 queries in database operations; optimize with joins or batch queries  
- When adding new endpoints or components, always include type definitions and unit tests  
- Keep the agents.md context concise (<500 lines) and modular; use Skills Registry if the project grows  

## Agent Behavior
- Only generate code compatible with the stack and architecture defined here  
- Do not hallucinate database fields, API endpoints, or external services not defined  
- Always suggest improvements aligned with performance, maintainability, and scalability  
- Provide code examples with type safety, clear naming, and proper documentation  