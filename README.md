# Pokemon API Demo

[![Tests](https://github.com/walteraggor/pokemon-api-demo/actions/workflows/tests.yml/badge.svg)](https://github.com/walteraggor/pokemon-api-demo/actions/workflows/tests.yml)

A first experiment with calling a web API from JavaScript. `fetch-pokemon.js` asks the public [PokéAPI](https://pokeapi.co) about a Pokémon and prints a few facts from the JSON reply.

## Run it

You need Node.js 18 or newer, because the script uses the built-in `fetch`. There are no packages to install.

```bash
git clone https://github.com/walteraggor/pokemon-api-demo.git
cd pokemon-api-demo
node fetch-pokemon.js
```

```
--- Sending request to the API for "pikachu"... ---
--- Request sent! Waiting for the response... ---
--- Success! Data received: ---
Name: PIKACHU
Number: 25
Types: electric
Height: 0.4 m
Weight: 6 kg
Abilities: static, lightning-rod
```

To ask about another Pokémon, put its name or its Pokédex number after the file name:

```bash
node fetch-pokemon.js charizard
node fetch-pokemon.js 6
```

Capital letters do not matter. Use the name as PokéAPI spells it, which has a hyphen where the name has a space: `mr-mime`, `tapu-koko`.

If the API does not know the name, the script says so:

```bash
node fetch-pokemon.js pikachuu
```

```
--- Sending request to the API for "pikachuu"... ---
--- Request sent! Waiting for the response... ---
Something went wrong: The API does not know a Pokémon called "pikachuu".
```

## What the script shows

1. An endpoint is a URL: `https://pokeapi.co/api/v2/pokemon/pikachu`.
2. `fetch(url)` sends a GET request and returns a promise straight away. `await` waits until the reply has arrived.
3. Every reply has a status. `response.ok` is true when the request worked, and a status of 404 means the API has nothing at that address.
4. `response.json()` turns the body of the reply into a JavaScript object.
5. The result is read like any other object: `data.name`, `data.weight`, `data.abilities[0].ability.name`.
6. `try` and `catch` handle failures, such as having no internet connection or asking for a Pokémon that does not exist.

Notice that `Request sent!` is printed before the data. `fetch` is asynchronous: calling `getPokemon(name)` starts the request and the script carries on. It only stops to wait at the line that says `await`.

The API gives height in tenths of a metre and weight in tenths of a kilogram. The script divides both by 10, so Pikachu's `4` and `60` are shown as 0.4 m and 6 kg.

## Tests

```bash
node --test
```

The tests replace `fetch` with a stand-in that answers the way the API does, so they do not need the internet. They cover a Pokémon that exists, one that does not, an API error, no connection, and the order in which the lines are printed.

GitHub runs the tests on Linux and Windows for every push and pull request.
