// Every film set, one file per batch. Ids are neutral on purpose: the server owns the titles.
import { REELS as CORE1 } from "./reels/core1.js";
import { REELS as CORE2 } from "./reels/core2.js";
import { REELS as B01 } from "./reels/b01.js";
import { REELS as B02 } from "./reels/b02.js";
import { REELS as B03 } from "./reels/b03.js";
import { REELS as B04 } from "./reels/b04.js";
import { REELS as B05 } from "./reels/b05.js";
import { REELS as B06 } from "./reels/b06.js";
import { REELS as B07 } from "./reels/b07.js";
import { REELS as B08 } from "./reels/b08.js";
import { REELS as B09 } from "./reels/b09.js";
import { REELS as B10 } from "./reels/b10.js";

export const REELS = { ...CORE1, ...CORE2, ...B01, ...B02, ...B03, ...B04, ...B05, ...B06, ...B07, ...B08, ...B09, ...B10 };
