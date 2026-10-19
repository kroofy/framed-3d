// Answers live only on the server. Clients get a neutral reel id and build the 3D set for it,
// but never learn the title until the round is revealed.

export type Movie = {
	readonly reel: string;
	readonly title: string;
	readonly year: number;
	readonly aliases: readonly string[];
	readonly trivia: string;
};

import { MOVIES as B01 } from "./movies/b01.ts";
import { MOVIES as B02 } from "./movies/b02.ts";
import { MOVIES as B03 } from "./movies/b03.ts";
import { MOVIES as B04 } from "./movies/b04.ts";
import { MOVIES as B05 } from "./movies/b05.ts";
import { MOVIES as B06 } from "./movies/b06.ts";
import { MOVIES as B07 } from "./movies/b07.ts";
import { MOVIES as B08 } from "./movies/b08.ts";
import { MOVIES as B09 } from "./movies/b09.ts";
import { MOVIES as B10 } from "./movies/b10.ts";

const CORE: readonly Movie[] = [
	{ reel: "r01", title: "Jaws", year: 1975, aliases: [], trivia: "The mechanical shark was nicknamed Bruce, after Spielberg's lawyer." },
	{ reel: "r02", title: "Jurassic Park", year: 1993, aliases: [], trivia: "The water ripple was made by plucking a guitar string run under the dashboard." },
	{ reel: "r03", title: "2001: A Space Odyssey", year: 1968, aliases: ["2001", "2001 a space odyssey", "a space odyssey"], trivia: "Kubrick's monolith was originally planned to be a transparent tetrahedron." },
	{ reel: "r04", title: "The Matrix", year: 1999, aliases: ["matrix"], trivia: "The digital rain is made of mirrored Japanese katakana from a sushi cookbook." },
	{ reel: "r05", title: "Titanic", year: 1997, aliases: [], trivia: "The ship model was built at roughly 90% scale in Rosarito, Mexico." },
	{ reel: "r06", title: "Star Wars", year: 1977, aliases: ["star wars a new hope", "a new hope", "star wars episode iv", "star wars episode iv a new hope", "episode iv"], trivia: "The binary sunset was shot in Death Valley, after a sandstorm wrecked the Tunisia set." },
	{ reel: "r07", title: "E.T. the Extra-Terrestrial", year: 1982, aliases: ["et", "e t", "et the extra terrestrial", "e.t."], trivia: "E.T.'s voice is partly Pat Welsh, a woman who smoked two packs a day." },
	{ reel: "r08", title: "Back to the Future", year: 1985, aliases: ["back to the future part 1", "bttf"], trivia: "The DeLorean nearly got cut for a refrigerator as the time machine." },
	{ reel: "r09", title: "Up", year: 2009, aliases: [], trivia: "Animators worked out it would take about 26.5 million balloons to lift the house." },
	{ reel: "r10", title: "Raiders of the Lost Ark", year: 1981, aliases: ["indiana jones", "indiana jones and the raiders of the lost ark", "raiders"], trivia: "The boulder was fiberglass and plaster, and it still weighed around 140 kg." },
	{ reel: "r11", title: "The Shining", year: 1980, aliases: ["shining"], trivia: "The hedge maze isn't in the novel. Stephen King used topiary animals." },
	{ reel: "r12", title: "Interstellar", year: 2014, aliases: [], trivia: "The black hole render produced research papers on gravitational lensing." },
	{ reel: "r13", title: "King Kong", year: 1933, aliases: ["kong"], trivia: "The original Kong was an 18-inch armature covered in rabbit fur." },
	{ reel: "r14", title: "The Wizard of Oz", year: 1939, aliases: ["wizard of oz"], trivia: "The ruby slippers were silver in the book. Red looked better in Technicolor." },
	{ reel: "r15", title: "The Lord of the Rings: The Fellowship of the Ring", year: 2001, aliases: ["lord of the rings", "the lord of the rings", "lotr", "fellowship of the ring", "the fellowship of the ring", "lord of the rings the fellowship of the ring", "the return of the king", "return of the king", "the two towers", "two towers"], trivia: "Peter Jackson's crew made about 40 copies of the One Ring." },
	{ reel: "r16", title: "Inception", year: 2010, aliases: [], trivia: "The rotating hallway was a full-size set built inside a giant turning drum." },
];

export const MOVIES: readonly Movie[] = [...CORE, ...B01, ...B02, ...B03, ...B04, ...B05, ...B06, ...B07, ...B08, ...B09, ...B10];

const BY_REEL = new Map(MOVIES.map((movie) => [movie.reel, movie]));

export function movie(reel: string): Movie {
	const found = BY_REEL.get(reel);
	if (found === undefined) throw new Error(`Unknown reel ${reel}`);
	return found;
}

export function normalizeTitle(text: string): string {
	return text
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/&/g, " and ")
		.replace(/\(\d{4}\)/g, " ")
		.replace(/[^a-z0-9]+/g, " ")
		.replace(/^(the|a|an) /, "")
		.trim();
}

export function isCorrect(reel: string, guess: string): boolean {
	const answer = movie(reel);
	const normalized = normalizeTitle(guess);
	if (normalized.length === 0) return false;
	return [answer.title, ...answer.aliases].some((candidate) => normalizeTitle(candidate) === normalized);
}

// Decoys for the autocomplete, so the list itself gives nothing away.
const DECOYS = [
	"Alien", "Aliens", "Apocalypse Now", "Amélie", "American Beauty", "Avatar", "Avengers: Endgame", "Babe", "Barbie", "Batman",
	"Beetlejuice", "Ben-Hur", "Big", "Blade Runner", "Blade Runner 2049", "Braveheart", "Breakfast at Tiffany's", "Casablanca", "Catch Me If You Can", "Chinatown",
	"Citizen Kane", "Close Encounters of the Third Kind", "Coco", "Contact", "Dirty Dancing", "Die Hard", "Django Unchained", "Dr. Strangelove", "Dune", "Dune: Part Two",
	"Edward Scissorhands", "Everything Everywhere All at Once", "Fargo", "Ferris Bueller's Day Off", "Fight Club", "Finding Nemo", "Forrest Gump", "Frozen", "Get Out", "Ghostbusters",
	"Gladiator", "Godzilla", "Goodfellas", "Gone with the Wind", "Gravity", "Grease", "Groundhog Day", "Halloween", "Harry Potter and the Philosopher's Stone", "Heat",
	"Home Alone", "Inglourious Basterds", "Inside Out", "Independence Day", "Jumanji", "Kill Bill: Volume 1", "La La Land", "Lawrence of Arabia", "Léon: The Professional", "Life of Pi",
	"Mad Max: Fury Road", "Mary Poppins", "Memento", "Men in Black", "Metropolis", "Moana", "Moonlight", "Mrs. Doubtfire", "Mulan", "No Country for Old Men",
	"North by Northwest", "Oppenheimer", "Parasite", "Pirates of the Caribbean: The Curse of the Black Pearl", "Planet of the Apes", "Poltergeist", "Psycho", "Pulp Fiction", "Ratatouille", "Rear Window",
	"Reservoir Dogs", "Rocky", "Rosemary's Baby", "Saving Private Ryan", "Schindler's List", "Scream", "Se7en", "Shrek", "Singin' in the Rain", "Snow White and the Seven Dwarfs",
	"Some Like It Hot", "Spirited Away", "Superman", "Taxi Driver", "Terminator 2: Judgment Day", "The Terminator", "The Big Lebowski", "The Dark Knight", "The Departed", "The Exorcist",
	"The Fifth Element", "The Godfather", "The Godfather Part II", "The Goonies", "The Grand Budapest Hotel", "The Graduate", "The Great Escape", "The Green Mile", "The Incredibles", "The Lion King",
	"The Little Mermaid", "The Notebook", "The Princess Bride", "The Shawshank Redemption", "The Silence of the Lambs", "The Sixth Sense", "The Sound of Music", "The Truman Show", "The Usual Suspects", "There Will Be Blood",
	"Thelma & Louise", "Top Gun", "Total Recall", "Toy Story", "Trainspotting", "Twister", "Vertigo", "WALL-E", "Waterworld", "When Harry Met Sally...",
	"Who Framed Roger Rabbit", "Willy Wonka & the Chocolate Factory", "Zodiac", "Gremlins", "Tremors", "The Abyss", "Cast Away", "Life of Brian", "Monty Python and the Holy Grail", "RoboCop",
	"The Thing", "Predator", "Starship Troopers", "Arrival", "Ex Machina", "Her", "Gattaca", "Solaris", "Moon", "Sunshine",
	"Event Horizon", "Armageddon", "Deep Impact", "The Martian", "Apollo 13", "First Man", "Ad Astra", "Avatar: The Way of Water", "Tron", "Tron: Legacy",
	"Ready Player One", "Hook", "War of the Worlds", "Minority Report", "A.I. Artificial Intelligence", "Duel", "Indiana Jones and the Temple of Doom", "Indiana Jones and the Last Crusade", "The Lost World: Jurassic Park", "Jurassic World",
	"Back to the Future Part II", "Back to the Future Part III", "Star Wars: The Empire Strikes Back", "Return of the Jedi", "The Phantom Menace", "Rogue One", "The Force Awakens", "The Hobbit: An Unexpected Journey", "The Matrix Reloaded", "The Matrix Revolutions",
	"Tenet", "Dunkirk", "The Prestige", "Batman Begins", "The Dark Knight Rises", "Doctor Sleep", "Carrie", "It", "Misery", "Stand by Me",
	"A Clockwork Orange", "Barry Lyndon", "Full Metal Jacket", "Eyes Wide Shut", "Paths of Glory", "Spartacus", "Lolita", "The Wizard of Lies", "Return to Oz", "Wicked",
	"Oz the Great and Powerful", "Mighty Joe Young", "Kong: Skull Island", "Godzilla vs. Kong", "Cloverfield", "Pacific Rim", "Monsters, Inc.", "Cars", "Brave", "Soul",
	"Elemental", "Luca", "Turning Red", "Lightyear", "Onward", "A Bug's Life", "The Boat That Rocked", "Master and Commander", "Life Aquatic", "The Poseidon Adventure",
];

export const TITLE_CHOICES: readonly string[] = [...new Set([...MOVIES.map((m) => m.title), ...DECOYS])].sort((a, b) =>
	a.localeCompare(b),
);
