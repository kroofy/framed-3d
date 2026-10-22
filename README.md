# 🎬 Framed 3D

A multiplayer take on [framed.wtf](https://framed.wtf/): guess the movie, but every "frame" is a camera shot of a hand-built,
low-poly **3D diorama** of a famous scene. You get six shots per reel, from cryptic to obvious. Every wrong guess or skip
cuts to the next one. You can drag to peek around the set.

- 117 reels, from Casablanca and Psycho to Barbie and Oppenheimer, including The Hitchhiker's Guide to the Galaxy (r17).
  Run `node -e "import('./server/movies.ts').then(m => console.log(m.MOVIES.map(x => x.title).join('\n')))"` for the full list, which spoils them all.
- Live rooms: share a 4-letter code or link, and everyone plays the same reel at the same time with a timer, scoreboard, and chat.
- Scoring: 600 points for a first-frame solve, down to 100 on the sixth frame. The first solver of a reel gets +50, and each hint costs 100.
- Titles never leave the server until the reveal, so nobody can peek in devtools. Chat blocks spoilers.

## Run it

```sh
npm install
npm start          # http://localhost:8787
```

This needs Node ≥ 24, which runs the TypeScript server directly. Open the URL, enter a name, and press **Start a screening**.
Friends join with the code or the **Invite** link. A first-time visitor on an invite link sees the room and is asked for a
name before taking a seat. The name is kept in a `framed_name` cookie for a year, so later invite links offer
one-tap **Continue as …**, with a "Not you?" option for shared devices.

### Playing with friends remotely

The server prints its LAN addresses. For friends elsewhere, expose port 8787 using any of these:

- `tailscale serve 8787` / `tailscale funnel 8787`
- `cloudflared tunnel --url http://localhost:8787`
- `ngrok http 8787`
- forward the port on your router

WebSockets go over the same port on `/ws`, so any of these work as-is.

## Built on pi-durable

Each room is a durable conversation in [`@earendil-works/pi-durable`](https://www.npmjs.com/package/@earendil-works/pi-durable),
stored in SQLite at `data/framed.sqlite` (set `FRAMED_DATA` to change the directory):

- The room state is a durable document. Clients receive a per-player projection of it, which hides other players' guesses until the reveal.
- Round deadlines are durable background tasks (`runtime.sleep`). If you restart the server mid-reel, the timer
  resumes where it was and the reel still ends on time. Browsers reconnect by themselves.
- **The Projectionist** (optional) is an AI host that lives in the same conversation. It answers `@projectionist` questions in chat
  without spoiling, gives up to two cryptic hints per reel, and quips at each reveal. It turns on when an API key is set:

  ```sh
  ANTHROPIC_API_KEY=… npm start     # or OPENAI_API_KEY=…
  FRAMED_MODEL=claude-sonnet-4-5    # optional override
  FRAMED_AI=off                     # force it off
  ```

## Development

```sh
npm run dev        # restart on change
npm test           # game logic, scoring, restart durability, AI host (faux model)
```

- `server/movies.ts` holds titles, aliases, and trivia. This is the only place titles live.
- `server/game.ts` holds the room doc, durable clock, scoring, and the Projectionist extension.
- `server/main.ts` is the HTTP + WebSocket server.
- `public/stage.js` is the Three.js stage and its kit of low-poly helpers.
- `public/reels.js` builds the original 16 sets, and `public/reels/bNN.js` builds the rest, each with 6 shots ordered cryptic → obvious.
- `server/movies/bNN.ts` holds the matching answers. `npm test` checks that every set has a movie and that no two movies share an alias.

To preview a set, open `/?preview=r07&f=0` and switch shots with `__setFrame(n)` in the console. This view spoils the reel.

To add a reel:
1. Add an entry to a `server/movies/bNN.ts` file.
2. Add a builder with the same id to the matching `public/reels/bNN.js`.
3. Check every shot in preview mode.
