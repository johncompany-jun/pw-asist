.PHONY: up down build restart logs ps

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
