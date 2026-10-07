// 1. We define the "Address" (Endpoint) of the API we want to talk to.
const url = "https://pokeapi.co/api/v2/pokemon/pikachu"; // This is a public API that gives us info about Pokémon. We're asking for Pikachu!

// 2. We use "fetch" to send a GET request (Like asking a question)
console.log("---Sending Request to the API...---");

fetch(url)
    .then((response) => {
        // 3. The API sends back a "Response". We turn it into JSON (readable text).
        return response.json();
    })
    .then((data) => {
        // 4. Now we can see the data!
        console.log("---Success! Data Received: --");
        console.log("Name:", data.name.toUpperCase());
        console.log("Weight:", data.weight);
        console.log("First Ability:", data.abilities[0].ability.name);
    })
    .catch((error) => {
        // 5. If the internet is down or the url is wrong, we catch the error here.
        console.error("Something went wrong:", error);

    });
    
    console.log("---Request Sent! Response...---"); 


