# Everything runs in Docker — no node or npm on the host.
COMPOSE := docker compose

.PHONY: dev deps shell test e2e prod down

dev:   ## dev server with HMR on http://localhost:5173
	$(COMPOSE) up --build dev

deps:  ## after a package.json change: rebuild and renew the container's node_modules
	$(COMPOSE) build dev && $(COMPOSE) up --renew-anon-volumes dev

shell: ## a shell in the dev image, source mounted
	$(COMPOSE) run --build --rm dev sh

test:  ## check + lint + depcheck + server unit tests
	$(COMPOSE) run --build --rm test

e2e:   ## browser unit projects + Playwright e2e; reports land in test-result/
	$(COMPOSE) run --build --rm e2e

prod:  ## production build (adapter-node) on http://localhost:3000
	$(COMPOSE) up --build prod

down:  ## stop everything and drop the node_modules volume
	$(COMPOSE) --profile '*' down --remove-orphans --volumes
