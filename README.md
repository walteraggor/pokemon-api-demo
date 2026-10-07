# Pokemon API Demo

A first experiment with calling a web API from JavaScript. `fetch-pokemon.js` asks the public [PokéAPI](https://pokeapi.co) for Pikachu and prints a few fields from the JSON reply.

## Run it

You need Node.js 18 or newer, because the script uses the built-in `fetch`. There are no packages to install.

```bash
git clone https://github.com/walteraggor/pokemon-api-demo.git
cd pokemon-api-demo
node fetch-pokemon.js
```

Expected output:

```
---Sending Request to the API...---
---Request Sent! Response...---
---Success! Data Received: --
Name: PIKACHU
Weight: 60
First Ability: static
```

The API reports weight in hectograms, so `60` means 6 kg.

## What the script shows

1. An endpoint is a URL: `https://pokeapi.co/api/v2/pokemon/pikachu`.
2. `fetch(url)` sends a GET request and immediately returns a promise.
3. `response.json()` turns the body of the reply into a JavaScript object.
4. The result is read like any other object: `data.name`, `data.weight`, `data.abilities[0].ability.name`.
5. `.catch()` handles failures, such as having no internet connection or asking for a Pokémon that does not exist.

Notice that `Request Sent!` is printed before the data. `fetch` is asynchronous: the script carries on while the request is on its way, and the `.then()` callbacks run once the reply arrives.

## Try changing it

Replace `pikachu` in the URL with another Pokémon such as `charizard` or `bulbasaur`, or with a Pokédex number such as `25`.
