.PHONY: linked
linked: ; MANUALRUN=1 docker-compose -f docker-compose.yml -f docker-compose.linked.yml up

.PHONY: start
start: ; docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

.PHONY: build
build:
	docker-compose -f docker-compose.yml -f docker-compose.linked.yml build

.PHONY: frontend.cli
frontend.cli:
	docker exec -ti ethereum_lottery_frontend bash

.PHONY: clean
clean:
	docker rm -f ethereum_lottery_frontend 
