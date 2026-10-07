// A first experiment with calling a web API: ask PokéAPI about a Pokémon and print the answer.
//
//   node fetch-pokemon.js              asks about Pikachu
//   node fetch-pokemon.js charizard    asks about another Pokémon

// 1. We define the "Address" (Endpoint) of the API we want to talk to.
//    This is a public API that gives us info about Pokémon.
const API_URL = "https://pokeapi.co/api/v2/pokemon";

// Asks the API about one Pokémon and gives back the data it sends.
async function getPokemon(name) {
    const url = `${API_URL}/${encodeURIComponent(name)}`;

    // 2. We use "fetch" to send a GET request (Like asking a question).
    //    "await" pauses this function until the API has answered.
    let response;
    try {
        response = await fetch(url, { signal: AbortSignal.timeout(10000) }); // Give up after 10 seconds
    } catch {
        // fetch itself fails when no answer arrives at all, for example when the internet is down.
        throw new Error("Could not reach the API. Check your internet connection and try again.");
    }

    // 3. The API sends back a "Response". Its status says whether the question could be answered.
    if (response.status === 404) {
        throw new Error(`The API does not know a Pokémon called "${name}".`);
    }
    if (!response.ok) {
        throw new Error(`The API answered with an error (status ${response.status}).`);
    }

    // 4. The answer arrives as JSON text. We turn it into a JavaScript object.
    return response.json();
}

// Picks a few facts out of the data and returns them as lines of text.
function describePokemon(data) {
    return [
        `Name: ${data.name.toUpperCase()}`,
        `Number: ${data.id}`,
        `Types: ${data.types.map((entry) => entry.type.name).join(", ")}`,
        // The API gives the height in tenths of a metre and the weight in tenths of a kilogram.
        `Height: ${data.height / 10} m`,
        `Weight: ${data.weight / 10} kg`,
        `Abilities: ${data.abilities.map((entry) => entry.ability.name).join(", ")}`,
    ];
}

async function main(words) {
    // The Pokémon to ask about is whatever was typed after the file name. Without that, it is Pikachu.
    const name = words.join(" ").trim().toLowerCase().replace(/\s+/g, "-") || "pikachu";

    console.log(`--- Sending request to the API for "${name}"... ---`);
    const request = getPokemon(name); // This starts the request and carries straight on
    console.log("--- Request sent! Waiting for the response... ---");

    try {
        const data = await request; // This waits until the data has arrived

        // 5. Now we can see the data!
        console.log("--- Success! Data received: ---");
        for (const line of describePokemon(data)) {
            console.log(line);
        }
    } catch (error) {
        // 6. If the internet is down or the name is wrong, we catch the error here.
        console.error("Something went wrong:", error.message);
        process.exitCode = 1; // Tells the terminal that the script did not succeed
    }
}

// Run main() only when this file is started with "node fetch-pokemon.js",
// and not when another file, such as the tests, loads it.
if (require.main === module) {
    main(process.argv.slice(2));
}

module.exports = { getPokemon, describePokemon, main };
