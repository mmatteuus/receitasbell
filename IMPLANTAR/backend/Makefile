.PHONY: lint typecheck build test gate smoke sbom secret-scan

lint:
	npm run lint

typecheck:
	npm run typecheck

build:
	npm run build

test:
	npm run test:unit

gate:
	npm run gate

smoke:
	bash ./backend/scripts/smoke-test.sh

sbom:
	bash ./backend/scripts/sbom-generate.sh

secret-scan:
	bash ./backend/scripts/secret-scan.sh
