.PHONY: up down build restart logs ps deploy deploy-backend deploy-frontend deploy-db

up:
	docker compose up -d

build:
	docker compose up --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

ps:
	docker compose ps

deploy: deploy-db deploy-backend deploy-frontend

deploy-db:
	cd apps/backend && npx wrangler d1 migrations apply pw-asist --remote

deploy-backend:
	cd apps/backend && npx wrangler deploy

deploy-frontend:
	cd apps/frontend && bun run build && npx wrangler pages deploy dist --project-name pw-asist-frontend --branch production
