// Tests for fetch-pokemon.js. Run them with:  node --test
//
// They never use the internet. "fetch" is replaced with a stand-in that
// answers the way the real API does.

const { test, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { getPokemon, describePokemon, main } = require("./fetch-pokemon.js");

const SCRIPT = path.join(__dirname, "fetch-pokemon.js");

// What the real API sends, cut down to the parts the script reads and a little more.
const PIKACHU = {
    id: 25,
    name: "pikachu",
    base_experience: 112,
    height: 4,
    weight: 60,
    types: [{ slot: 1, type: { name: "electric", url: "https://pokeapi.co/api/v2/type/13/" } }],
    abilities: [
        { ability: { name: "static", url: "https://pokeapi.co/api/v2/ability/9/" }, is_hidden: false, slot: 1 },
        { ability: { name: "lightning-rod", url: "https://pokeapi.co/api/v2/ability/31/" }, is_hidden: true, slot: 3 },
    ],
};

const CHARIZARD = {
    id: 6,
    name: "charizard",
    height: 17,
    weight: 905,
    types: [
        { slot: 1, type: { name: "fire", url: "https://pokeapi.co/api/v2/type/10/" } },
        { slot: 2, type: { name: "flying", url: "https://pokeapi.co/api/v2/type/3/" } },
    ],
    abilities: [
        { ability: { name: "blaze", url: "https://pokeapi.co/api/v2/ability/66/" }, is_hidden: false, slot: 1 },
        { ability: { name: "solar-power", url: "https://pokeapi.co/api/v2/ability/94/" }, is_hidden: true, slot: 3 },
    ],
};

const PIKACHU_LINES = [
    "Name: PIKACHU",
    "Number: 25",
    "Types: electric",
    "Height: 0.4 m",
    "Weight: 6 kg",
    "Abilities: static, lightning-rod",
];

// ---- Stand-ins for the internet -------------------------------------------

const realFetch = globalThis.fetch;
let requests = []; // every address the stand-in was asked for
let lastOptions; // the options given with the latest request

// Makes fetch answer with this status and body. A body that is not text is sent as JSON.
function apiAnswers(status, body) {
    requests = [];
    globalThis.fetch = async (url, options) => {
        requests.push(String(url));
        lastOptions = options;
        return new Response(typeof body === "string" ? body : JSON.stringify(body), { status });
    };
}

// Makes fetch fail the way it does when there is no internet connection.
function internetIsDown() {
    requests = [];
    globalThis.fetch = async (url) => {
        requests.push(String(url));
        throw new TypeError("fetch failed");
    };
}

// Runs main() and collects what it prints, instead of letting it reach the screen.
async function run(...words) {
    const printed = [];
    const realLog = console.log;
    const realError = console.error;
    console.log = (...parts) => printed.push(parts.join(" "));
    console.error = (...parts) => printed.push(parts.join(" "));
    try {
        await main(words);
    } finally {
        console.log = realLog;
        console.error = realError;
    }
    const failed = process.exitCode === 1;
    process.exitCode = 0;
    return { printed, failed };
}

afterEach(() => {
    globalThis.fetch = realFetch;
    process.exitCode = 0;
});

// ---- Asking the API --------------------------------------------------------

test("getPokemon asks the API for that Pokémon and returns its data", async () => {
    apiAnswers(200, PIKACHU);
    assert.deepEqual(await getPokemon("pikachu"), PIKACHU);
    assert.deepEqual(requests, ["https://pokeapi.co/api/v2/pokemon/pikachu"]);
});

test("getPokemon keeps odd characters from changing the address", async () => {
    apiAnswers(200, PIKACHU);
    await getPokemon("mr mime/../?x=1");
    assert.deepEqual(requests, ["https://pokeapi.co/api/v2/pokemon/mr%20mime%2F..%2F%3Fx%3D1"]);
});

test("getPokemon does not wait for ever", async () => {
    apiAnswers(200, PIKACHU);
    await getPokemon("pikachu");
    assert.ok(lastOptions.signal instanceof AbortSignal);
});

test("a Pokémon the API does not know gives a clear message", async () => {
    apiAnswers(404, "Not Found");
    await assert.rejects(getPokemon("pikachuu"), { message: 'The API does not know a Pokémon called "pikachuu".' });
});

test("any other error from the API reports its status", async () => {
    for (const status of [500, 503, 429]) {
        apiAnswers(status, "Something broke");
        await assert.rejects(getPokemon("pikachu"), { message: `The API answered with an error (status ${status}).` });
    }
});

test("no internet connection gives a clear message", async () => {
    internetIsDown();
    await assert.rejects(getPokemon("pikachu"), {
        message: "Could not reach the API. Check your internet connection and try again.",
    });
});

// ---- Describing the data ---------------------------------------------------

test("describePokemon lists the facts, with height and weight in metres and kilograms", () => {
    assert.deepEqual(describePokemon(PIKACHU), PIKACHU_LINES);
});

test("describePokemon lists every type and ability", () => {
    assert.deepEqual(describePokemon(CHARIZARD), [
        "Name: CHARIZARD",
        "Number: 6",
        "Types: fire, flying",
        "Height: 1.7 m",
        "Weight: 90.5 kg",
        "Abilities: blaze, solar-power",
    ]);
});

// ---- The whole script ------------------------------------------------------

test("without a name, the script asks about Pikachu", async () => {
    apiAnswers(200, PIKACHU);
    const { printed, failed } = await run();
    assert.deepEqual(requests, ["https://pokeapi.co/api/v2/pokemon/pikachu"]);
    assert.deepEqual(printed, [
        '--- Sending request to the API for "pikachu"... ---',
        "--- Request sent! Waiting for the response... ---",
        "--- Success! Data received: ---",
        ...PIKACHU_LINES,
    ]);
    assert.equal(failed, false);
});

test("the name can be typed in any mix of capitals and with spaces", async () => {
    const typed = [
        [["charizard"], "charizard"],
        [["Charizard"], "charizard"],
        [["  CHARIZARD  "], "charizard"],
        [["Mr", "Mime"], "mr-mime"],
        [["Mr  Mime"], "mr-mime"],
        [["25"], "25"],
        [[""], "pikachu"],
        [["   "], "pikachu"],
    ];
    for (const [words, expected] of typed) {
        apiAnswers(200, CHARIZARD);
        await run(...words);
        assert.deepEqual(requests, [`https://pokeapi.co/api/v2/pokemon/${expected}`], `typed: ${JSON.stringify(words)}`);
    }
});

test('"Request sent!" is printed before the reply arrives', async () => {
    const events = [];
    const realLog = console.log;
    console.log = (...parts) => events.push(parts.join(" "));
    globalThis.fetch = async () => {
        await new Promise((resolve) => setTimeout(resolve, 20)); // the reply takes a moment
        events.push("(the reply arrives)");
        return new Response(JSON.stringify(PIKACHU));
    };
    try {
        await main(["pikachu"]);
    } finally {
        console.log = realLog;
    }
    assert.deepEqual(events.slice(0, 4), [
        '--- Sending request to the API for "pikachu"... ---',
        "--- Request sent! Waiting for the response... ---",
        "(the reply arrives)",
        "--- Success! Data received: ---",
    ]);
});

test("an unknown Pokémon ends with a message instead of data", async () => {
    apiAnswers(404, "Not Found");
    const { printed, failed } = await run("pikachuu");
    assert.deepEqual(printed, [
        '--- Sending request to the API for "pikachuu"... ---',
        "--- Request sent! Waiting for the response... ---",
        'Something went wrong: The API does not know a Pokémon called "pikachuu".',
    ]);
    assert.equal(failed, true);
});

test("no internet connection ends with a message instead of data", async () => {
    internetIsDown();
    const { printed, failed } = await run("pikachu");
    assert.equal(printed.at(-1), "Something went wrong: Could not reach the API. Check your internet connection and try again.");
    assert.equal(failed, true);
});

// ---- Started from the command line -----------------------------------------

// Starts "node fetch-pokemon.js" for real, with a stand-in for fetch loaded first.
function startScript(standIn, ...words) {
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "pokemon-test-"));
    const preload = path.join(folder, "stand-in.js");
    fs.writeFileSync(preload, `globalThis.fetch = ${standIn};`);
    try {
        return spawnSync(process.execPath, ["--require", preload, SCRIPT, ...words], { encoding: "utf8", timeout: 60000 });
    } finally {
        fs.rmSync(folder, { recursive: true, force: true });
    }
}

test("node fetch-pokemon.js prints the data and succeeds", () => {
    const standIn = `async () => new Response(${JSON.stringify(JSON.stringify(CHARIZARD))})`;
    const finished = startScript(standIn, "Charizard");
    assert.equal(finished.status, 0, finished.stderr);
    assert.deepEqual(finished.stdout.trimEnd().split(/\r?\n/), [
        '--- Sending request to the API for "charizard"... ---',
        "--- Request sent! Waiting for the response... ---",
        "--- Success! Data received: ---",
        "Name: CHARIZARD",
        "Number: 6",
        "Types: fire, flying",
        "Height: 1.7 m",
        "Weight: 90.5 kg",
        "Abilities: blaze, solar-power",
    ]);
});

test("node fetch-pokemon.js reports a failure through its exit code", () => {
    const finished = startScript(`async () => new Response("Not Found", { status: 404 })`, "pikachuu");
    assert.equal(finished.status, 1);
    assert.match(finished.stderr, /Something went wrong: The API does not know a Pokémon called "pikachuu"\./);
    assert.doesNotMatch(finished.stdout, /Success/);
});

test("loading the file from other code does not start a request", () => {
    const standIn = `async () => { console.log("fetch was called"); return new Response("{}"); }`;
    const folder = fs.mkdtempSync(path.join(os.tmpdir(), "pokemon-test-"));
    try {
        const loader = path.join(folder, "loader.js");
        fs.writeFileSync(loader, `globalThis.fetch = ${standIn};\nrequire(${JSON.stringify(SCRIPT)});\n`);
        const finished = spawnSync(process.execPath, [loader], { encoding: "utf8", timeout: 60000 });
        assert.equal(finished.status, 0, finished.stderr);
        assert.equal(finished.stdout, "");
    } finally {
        fs.rmSync(folder, { recursive: true, force: true });
    }
});
