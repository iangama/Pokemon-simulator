# Monsters Legacy (Browser RPG)

RPG de navegador autoral, inspirado na estrutura clássica de Pokemon (GB/GBA), com:
- exploracao por areas conectadas
- encontros selvagens
- batalha por turnos
- captura
- time de ate 6 + storage
- niveis, XP e evolucao por level-up
- inventario, loja, centro Pokemon
- treinadores, ginasio e badges
- Pokedex com paginacao/lazy loading
- save/load local com validacao basica
- colecao TCG secundaria (Pokemon TCG API + TCGdex)

## APIs usadas (somente endpoints documentados)

### PokéAPI
- `GET /api/v2/pokemon?limit&offset`
- `GET /api/v2/pokemon/{id or name}`
- `GET /api/v2/pokemon-species/{id or name}`
- `GET /api/v2/evolution-chain/{id}` (via `evolution_chain.url`)
- `GET /api/v2/move/{id or name}`
- `GET /api/v2/type/{id or name}`

### Pokemon TCG API
- `GET /v2/cards`
- `GET /v2/cards/{id}`
- `GET /v2/sets`
- `GET /v2/sets/{id}`
- `GET /v2/rarities`

### TCGdex
- `GET /v2/{lang}/cards`
- `GET /v2/{lang}/cards/{id}`
- `GET /v2/{lang}/sets`
- `GET /v2/{lang}/sets/{id}`
- `GET /v2/{lang}/series`
- `GET /v2/{lang}/series/{id}`

## Como rodar

```bash
cd /mnt/c/Users/Ian/pokemon-browser-rpg
npm install
npm run dev
```

Build:
```bash
npm run build
npm run preview
```

## Observacoes
- Sem backend (persistencia local via LocalStorage).
- Arquitetura separa UI, dominio, engine e store para escalar para muito mais Pokemon.
- Evolucao complexa (itens, troca, horario etc.) tem fallback e foco atual em evolucao por nivel.
-  Deploy (Vercel)

  O deploy recomendado é na Vercel para este projeto React + Vite.

  ### Passos rápidos
  1. Importar o repositório no Vercel.
  2. Build command: `npm run build`
  3. Output directory: `dist`
  4. Deploy.

  ### Observação sobre link inativo
  Se o link ficar temporariamente inativo (como pode acontecer em plataformas gratuitas), normalmente
  é só abrir a URL e aguardar alguns segundos para o serviço “acordar”. https://pokemon-simulator-olive.vercel.app/
  
