import type { Movie } from "../movies.ts";

export const MOVIES: readonly Movie[] = [
	{ reel: "r28", title: "Gladiator", year: 2000, aliases: [], trivia: "Oliver Reed died during the shoot, so his last scenes were finished with a body double and a digitally added face." },
	{ reel: "r29", title: "Pulp Fiction", year: 1994, aliases: [], trivia: "Pulp Fiction won the Palme d'Or at the 1994 Cannes Film Festival." },
	{ reel: "r30", title: "Forrest Gump", year: 1994, aliases: [], trivia: "Tom Hanks's younger brother Jim doubled for him in many of the cross-country running scenes." },
	{ reel: "r31", title: "The Silence of the Lambs", year: 1991, aliases: ["silence of lambs"], trivia: "It is one of only three films to win all five major Oscars: Picture, Director, Actor, Actress and Screenplay." },
	{
		reel: "r32",
		title: "Pirates of the Caribbean: The Curse of the Black Pearl",
		year: 2003,
		aliases: ["pirates of the caribbean", "pirates of the caribbean 1", "curse of the black pearl", "the curse of the black pearl", "pirates of the caribbean the curse of the black pearl", "potc"],
		trivia: "Johnny Depp modelled Captain Jack Sparrow partly on Rolling Stones guitarist Keith Richards.",
	},
	{
		reel: "r33",
		title: "Harry Potter and the Philosopher's Stone",
		year: 2001,
		aliases: ["harry potter and the sorcerer's stone", "harry potter and the philosophers stone", "philosopher's stone", "sorcerer's stone", "harry potter 1", "harry potter and the philosopher stone"],
		trivia: "Every scene mentioning the stone was shot twice, once saying \"Philosopher's\" and once \"Sorcerer's\" for the American release.",
	},
	{ reel: "r34", title: "Avatar", year: 2009, aliases: ["avatar 2009"], trivia: "Linguist Paul Frommer invented the Na'vi language for the film." },
	{ reel: "r35", title: "The Dark Knight", year: 2008, aliases: ["batman the dark knight", "the dark knight 2008"], trivia: "Heath Ledger won a posthumous Academy Award for Best Supporting Actor for his Joker." },
	{ reel: "r36", title: "Mad Max: Fury Road", year: 2015, aliases: ["fury road", "mad max 4"], trivia: "The Doof Warrior's flame-throwing guitar was a real, working prop." },
	{ reel: "r37", title: "Gravity", year: 2013, aliases: [], trivia: "Sandra Bullock acted inside a \"Light Box\", a cube of LED panels that lit her with the surrounding space and Earth." },
];
