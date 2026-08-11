dev-install:
	docker run --rm \
	-v ${PWD}:/app \
	-w /app \
	node:20-alpine npm i

dev-run:
	docker run --rm \
	-v ${PWD}:/app \
	-p 5173:5173 \
	-w /app \
	-e VITE_SUPABASE_URL=https://qdisfurybyhjcaunzumb.supabase.co \
	-e VITE_SUPABASE_ANON_KEY=sb_publishable_s1nGo7b8ACx47NQzNW-J6w_YOOy6-qr \
	node:20-alpine npm run dev

audit:
	docker run --rm \
	-v ${PWD}:/app \
	-w /app \
	node:20-alpine npm audit