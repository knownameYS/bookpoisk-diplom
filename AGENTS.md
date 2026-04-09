# AGENTS.md

Work only inside:
- /frontend
- /backend

Rules:
1. Do not create nested folders like backend/backend or frontend/frontend.
2. Do not scan or modify node_modules, dist, build.
3. Backend root is /backend.
4. Frontend root is /frontend.
5. Use the existing PostgreSQL schema as the source of truth.
6. If favorites/collections are missing in the schema, extend the DB through migrations.
7. The 84 algorithm is mandatory and must be implemented exactly as specified.
8. Create runnable code, not stubs.
9. Leave a README with exact setup commands.