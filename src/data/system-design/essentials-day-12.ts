/**
 * Day 12 of "System Design Essentials": design a social media feed.
 * Built from the Day 12 video script. The social app, its numbers and its
 * creators are fictional teaching examples, not any company's real design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 12 · Design a social feed",
  hookLines: [
    "A creator posts a photo.",
    "Their followers open their feeds.",
    "A normal creator has 100 followers. A popular one has 10 lakh. Is one approach best for both?",
  ],
  question: "When should the system work out who sees the post: when it’s published, or when the feed is opened?",

  pre: [
    {
      id: "pre-1",
      scenario: "Creator A has 100 followers. Creator B has 10 lakh.",
      prompt: "Does the same approach have to suit both?",
      choices: [
        { text: "Not necessarily: a huge number of followers can make some approaches expensive, so very popular creators may need a different one", why: "Right. Scale changes the cost of each approach.", best: true },
        { text: "Yes: one approach always fits everyone", why: "Large fan-out is expensive, so it isn’t one size fits all." },
        { text: "Yes: followers don’t affect cost", why: "The number of followers changes how much work a post creates." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Followers’ feed lists hold post IDs. Later, a post is deleted and an account is blocked.",
      prompt: "What must the system do?",
      choices: [
        { text: "Handle stale feed entries and enforce access rules before returning results; the original post is the authoritative record", why: "Yes. Feed entries are a convenience, so deletions, blocks and visibility changes must be respected.", best: true },
        { text: "Nothing: the feed entry is the source of truth", why: "The original post is the authoritative record." },
        { text: "Show the old entry anyway", why: "That ignores privacy and blocks." },
      ],
    },
    {
      id: "pre-3",
      scenario: "An interviewer says: “Design a social feed.”",
      prompt: "What’s a good first step?",
      choices: [
        { text: "Clarify the scope, like a chronological following feed, and what’s out of scope, like ranking and ads", why: "Yes. Settle the scope before drawing.", best: true },
        { text: "Start with machine-learning ranking", why: "Ranking is out of scope until you agree it’s in." },
        { text: "Draw a CDN first", why: "Not before you know what you’re building." },
      ],
    },
  ],

  revealTitle: "From a post to many feeds",
  revealSub: "a fictional social app, simplified",
  reveal: [
    { when: "Scope", what: "A chronological following feed: recent posts from the accounts you follow, in time order. Ranking, ads and recommendations are out of scope. Privacy and blocks must be respected." },
    { when: "The data", what: "Posts (content and owner) and follow relationships are the source of truth. A feed request finds relevant post IDs, then their details." },
    { when: "Fan-out on write", what: "When a creator posts, a background queue and workers add the post ID to each follower’s feed entries. Opening the feed is then a quick read, but updates can be delayed, and duplicates must be handled." },
    { when: "A huge fan-out", what: "One post from a creator with 10 lakh followers could mean up to 10 lakh feed entries. That’s an illustrative number, not requests per second, and it can be expensive and slow." },
    { when: "Fan-out on read", what: "Nothing is prepared at posting time. When the feed opens, the service collects recent posts from the accounts followed, then merges and sorts them. Publishing is cheap; reading does more work." },
    { when: "Hybrid and pages", what: "Fan out ordinary creators’ posts, fetch very popular creators’ posts at read time, then merge and deduplicate. Return pages with a cursor and a stable order." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Feed", what: "The list of recent posts from accounts a user follows, shown in order.", example: "A chronological following feed" },
      { term: "Fan-out on write", what: "Preparing each follower’s feed when the post is published, using background work.", example: "A queue and workers add the post ID to follower feeds" },
      { term: "Fan-out on read", what: "Collecting and merging the recent posts when the follower opens the feed.", example: "Fetch from followed accounts, merge, sort" },
      { term: "Hybrid", what: "Fan out for ordinary creators and fetch at read time for very popular ones, then merge and deduplicate. The threshold isn’t a magic number: measure traffic and cost.", example: "Ordinary: write. Celebrity: read" },
      { term: "Cursor pagination", what: "Sending a few results at a time with a marker for where the next page starts. A stable order and a unique tie-breaker handle equal timestamps and new posts.", example: "Page one, cursor, page two" },
      { term: "Stale feed entry", what: "A prepared feed entry that no longer matches reality, like a deleted post or a blocked account.", example: "A removed post still listed" },
    ],
  },

  concept: {
    cards: [{
      name: "Fan-out on write",
      examples: ["Prepare feeds when a post is published", "A queue and workers do the work"],
      moves: ["Reading a feed is fast", "Publishing does more work", "A huge fan-out is expensive and can be delayed"],
    }, {
      name: "Fan-out on read",
      examples: ["Collect posts when a feed is opened", "Merge and sort on the spot"],
      moves: ["Publishing stays simple", "Reading does more work", "Costly if a user follows many accounts"],
    }],
    rule: "Write work now for fast reads, or read work later for simple writes. A hybrid mixes both.",
  },

  post: [
    {
      id: "post-1",
      prompt: "What happens in fan-out on write?",
      choices: [
        { text: "When a creator posts, the system prepares each follower’s feed entries in the background", why: "Yes: that makes opening a feed fast, at the cost of work at posting time.", best: true },
        { text: "Nothing happens until a follower opens the feed", why: "That’s fan-out on read." },
        { text: "The post is sent to the follower’s phone directly", why: "That isn’t what the term means." },
      ],
    },
    {
      id: "post-2",
      prompt: "What’s the trade-off of fan-out on read?",
      choices: [
        { text: "Publishing stays simple, but opening a feed does more work", why: "Right. The work moves to read time.", best: true },
        { text: "Reading is always faster than with write", why: "It’s usually the opposite: reads do the collecting and merging." },
        { text: "It removes the need for a database", why: "Posts and follows still live in a database." },
      ],
    },
    {
      id: "post-3",
      scenario: "Feed entries are added in the background. A worker is delayed, and the same task arrives twice.",
      prompt: "What should the design do?",
      choices: [
        { text: "Not promise every feed updates instantly, and deduplicate entries using stable post and follower identifiers", why: "Right. Background work can be late, and tasks can repeat.", best: true },
        { text: "Promise instant updates everywhere", why: "Background work can lag." },
        { text: "Show the entry twice", why: "Duplicates should be removed." },
      ],
    },
    {
      id: "post-4",
      prompt: "What does a hybrid feed do?",
      choices: [
        { text: "Fans out ordinary creators’ posts and fetches very popular creators’ posts at read time, then merges and deduplicates", why: "Yes. The threshold has to be chosen by measuring traffic and cost.", best: true },
        { text: "Fans out every post to every follower, always", why: "That’s pure fan-out on write, which is expensive for popular creators." },
        { text: "Uses a fixed magic follower count", why: "There’s no universal threshold." },
      ],
    },
    {
      id: "post-5",
      prompt: "Why use a stable order and a unique tie-breaker with a cursor?",
      choices: [
        { text: "Two posts can share a timestamp, and new posts can arrive between pages, so the cursor needs a stable position", why: "Right. It prevents duplicates and gaps between pages.", best: true },
        { text: "To make the feed look nicer", why: "It’s about correctness, not looks." },
        { text: "To send every post in one response", why: "Pagination sends a few at a time." },
      ],
    },
  ],

  build: {
    title: "Pick the feed approach",
    intro: "Drag each approach to the description it fits. You can also tap one, then tap a slot.",
    given: "A creator posts",
    rows: [["w", "r"], ["h", "p"]],
    slots: {
      w: { role: "Prepare each follower’s feed when the post is published", answer: "write" },
      r: { role: "Collect and merge recent posts when the feed is opened", answer: "read" },
      h: { role: "Prepare for ordinary creators, fetch for very popular ones", answer: "hybrid" },
      p: { role: "Send a few posts at a time with a marker for the next page", answer: "cursor" },
    },
    chips: [
      { id: "write", label: "Fan-out on write", does: "preparing follower feeds at posting time, using a queue and workers" },
      { id: "always", label: "Fan out every post to every follower, always", does: "an expensive choice for creators with huge followings" },
      { id: "read", label: "Fan-out on read", does: "collecting and merging recent posts when a feed is opened" },
      { id: "hybrid", label: "Hybrid", does: "mixing both, by creator size, then merging and deduplicating" },
      { id: "cursor", label: "Cursor pagination", does: "returning a few results at a time from a stable position" },
    ],
    done: "Write work now or read work later, a hybrid for both kinds of creator, and a cursor to page through the results.",
  },

  canvas: {
    title: "Draw it from scratch: fan-out on write",
    brief: "A creator publishes a post. Draw how it’s stored, how the work is passed to background workers, and how the followers’ feeds are prepared and read. Point each arrow from the part that sends the work or request to the part that receives it.",
    parts: ["client", "server", "database", "queue", "worker", "feed", "cache", "lb"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.08, y: 0.18 }, { id: "s", part: "server", x: 0.34, y: 0.18 },
        { id: "d", part: "database", x: 0.78, y: 0.18 }, { id: "q", part: "queue", x: 0.34, y: 0.58 },
        { id: "w", part: "worker", x: 0.62, y: 0.58 }, { id: "f", part: "feed", x: 0.62, y: 0.88 },
      ],
      edges: [["c", "s"], ["s", "d"], ["s", "q"], ["q", "w"], ["w", "f"], ["s", "f"]],
    },
    why: {
      "client>server": "The creator’s client sends the post to the app server.",
      "server>database": "The post and its owner are saved in the database, the authoritative record.",
      "server>queue": "The server puts the fan-out job on a queue, so the creator isn’t kept waiting for every follower’s feed.",
      "queue>worker": "Workers take jobs from the queue in the background.",
      "worker>feed": "A worker adds the post ID to each follower’s feed entries. It can be delayed, and duplicates must be handled.",
      "server>feed": "When a follower opens their feed, the server reads the prepared entries, then fetches the post details and checks access.",
    },
    done: "The post is stored, a queue and workers prepare followers’ feeds in the background, and opening a feed is a quick read. The database stays the source of truth.",
  },

  followUps: [
    {
      q: "“Design a social feed.”",
      answer: [
        "Clarify the scope first: chronological or ranked, and what’s out of scope.",
        "Store posts and follow relationships. Consider fan-out on write for common creators, and read-time fetch for high-follower creators, as a hybrid.",
        "Handle privacy, pagination and background delays.",
      ],
      say: "“I’d clarify the feed type, store posts and follows, use a hybrid of fan-out on write and read, and handle privacy, pagination and delays.”",
      deeper: "Days 14 and 15",
    },
    {
      q: "“Why not fan out every post to every follower?”",
      answer: [
        "One post from a creator with 10 lakh followers could mean up to 10 lakh feed entries.",
        "That can be expensive and slow, especially if many followers are rarely active.",
        "So fetch very popular creators’ posts at read time, and merge.",
      ],
      say: "“Huge fan-out is expensive, so I’d fetch very popular creators’ posts at read time and merge them with the prepared feed.”",
    },
    {
      q: "“A post is deleted or a user is blocked. What happens to the feeds?”",
      answer: [
        "Feed entries are a convenience. The original post is the authoritative record.",
        "Handle stale entries, and enforce the access rules before returning results.",
        "Respect privacy, blocks and visibility changes.",
      ],
      say: "“Feed entries are a convenience. I’d check the original post and the access rules before returning anything.”",
    },
  ],

  faq: [
    { q: "Is this how any real social app works?", a: "No. It’s a fictional teaching example, not a claim about any company’s internal design." },
    { q: "What is the right follower threshold for the hybrid?", a: "There isn’t a universal magic number. You choose it by measuring traffic and cost." },
    { q: "Will every follower’s feed update instantly?", a: "Don’t promise that. Background work can be delayed and tasks can repeat, so deduplicate." },
  ],

  interview: [
    "Clarify the scope: chronological or ranked, and what’s out.",
    "Store posts and follow relationships; the post is the authoritative record.",
    "Compare fan-out on write and on read, and propose a hybrid.",
    "Handle privacy, blocks and stale feed entries.",
    "Add cursor pagination and the background delay.",
  ],

  cheatsheet: {
    title: "Day 12 · Design a social feed",
    points: [
      "Clarify scope first: chronological following feed",
      "Posts and follows are the source of truth",
      "Fan-out on write: fast reads, work at posting time",
      "Fan-out on read: simple writes, work at read time",
      "Hybrid: ordinary creators written, popular ones read; merge and deduplicate",
      "Respect privacy and blocks; page with a stable cursor",
    ],
  },

  linkedin:
    "Day 12/21 of System Design Essentials with Klymb.\n\nHow does one post reach many feeds? Fan-out on write prepares follower feeds when it’s published; fan-out on read collects posts when a feed opens. For creators with huge followings, a hybrid fetches them at read time.\n\nDon’t forget privacy, blocks, background delays and a stable cursor for pages.\n\n#SystemDesign #Klymb",

  nextDay: "Day 13: the problem reverses. Many users want one seat. How do we stop it going to two people?",
};

const hi: DayCopy = {
  tag: "Day 12 · Social feed design karo",
  hookLines: [
    "Ek creator ek photo post karta hai.",
    "Uske followers apna feed kholte hain.",
    "Normal creator ke 100 followers hote hain. Popular ke 10 lakh. Kya dono ke liye ek hi approach best hai?",
  ],
  question: "System ko kab nikaalna chahiye ki post kise dikhegi: jab publish ho, ya jab feed khule?",

  pre: [
    {
      id: "pre-1",
      scenario: "Creator A ke 100 followers hain. Creator B ke 10 lakh.",
      prompt: "Kya dono ke liye ek hi approach honi zaroori hai?",
      choices: [
        { text: "Zaroori nahi: bahut saare followers kuch approaches ko mehnga bana sakte hain, isliye bahut popular creators ko alag approach chahiye ho sakti hai", why: "Sahi. Scale har approach ki cost badal deta hai.", best: true },
        { text: "Haan: ek approach sab par fit hoti hai", why: "Bada fan-out mehnga hai, isliye ek size sab par fit nahi hota." },
        { text: "Haan: followers cost ko affect nahi karte", why: "Followers ki ginti decide karti hai ki ek post kitna kaam banati hai." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Followers ke feed lists mein post IDs hain. Baad mein ek post delete hoti hai aur ek account block hota hai.",
      prompt: "System ko kya karna chahiye?",
      choices: [
        { text: "Stale feed entries handle karo aur results lautane se pehle access rules enforce karo; original post authoritative record hai", why: "Haan. Feed entries ek convenience hain, isliye deletions, blocks aur visibility changes ka dhyan rakhna padta hai.", best: true },
        { text: "Kuch nahi: feed entry hi source of truth hai", why: "Original post authoritative record hai." },
        { text: "Purani entry phir bhi dikha do", why: "Isse privacy aur blocks ignore hote hain." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Interviewer kehta hai: “Design a social feed.”",
      prompt: "Pehla achha step kya hai?",
      choices: [
        { text: "Scope clarify karo, jaise chronological following feed, aur kya out of scope hai, jaise ranking aur ads", why: "Haan. Draw karne se pehle scope tay karo.", best: true },
        { text: "Machine-learning ranking se shuru karo", why: "Ranking out of scope hai jab tak agree na ho ki woh scope mein hai." },
        { text: "Pehle CDN draw karo", why: "Jab tak pata na ho ki kya bana rahe ho, tab tak nahi." },
      ],
    },
  ],

  revealTitle: "Ek post se kai feeds tak",
  revealSub: "ek fictional social app, simplified",
  reveal: [
    { when: "Scope", what: "Chronological following feed: jin accounts ko aap follow karte ho unke recent posts, time order mein. Ranking, ads aur recommendations out of scope. Privacy aur blocks ka dhyan rakhna hai." },
    { when: "Data", what: "Posts (content aur owner) aur follow relationships source of truth hain. Feed request relevant post IDs dhoondhti hai, phir unki details." },
    { when: "Fan-out on write", what: "Creator post karta hai toh background queue aur workers har follower ki feed entries mein post ID jodte hain. Feed kholna phir ek quick read hai, par updates mein delay ho sakti hai, aur duplicates handle karne padte hain." },
    { when: "Bada fan-out", what: "10 lakh followers wale creator ki ek post ka matlab up to 10 lakh feed entries ho sakta hai. Yeh illustrative number hai, requests per second nahi, aur yeh mehnga aur slow ho sakta hai." },
    { when: "Fan-out on read", what: "Post ke waqt kuch taiyar nahi hota. Feed khulne par service followed accounts se recent posts collect karti hai, phir merge aur sort karti hai. Publishing sasti; reading mein zyada kaam." },
    { when: "Hybrid aur pages", what: "Ordinary creators ki posts fan out karo, bahut popular creators ki posts read time par fetch karo, phir merge aur deduplicate. Cursor aur stable order ke saath pages lautao." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Feed", what: "Un accounts ke recent posts ki list jinhe user follow karta hai, order mein dikhayi jaati hai.", example: "Chronological following feed" },
      { term: "Fan-out on write", what: "Post publish hote hi background work se har follower ka feed taiyar karna.", example: "Queue aur workers follower feeds mein post ID jodte hain" },
      { term: "Fan-out on read", what: "Follower ke feed kholne par recent posts collect aur merge karna.", example: "Followed accounts se fetch, merge, sort" },
      { term: "Hybrid", what: "Ordinary creators ke liye fan out, bahut popular ke liye read time par fetch, phir merge aur deduplicate. Threshold koi magic number nahi: traffic aur cost measure karo.", example: "Ordinary: write. Celebrity: read" },
      { term: "Cursor pagination", what: "Ek baar mein thode results bhejna, ek marker ke saath jo batata hai agla page kahan se shuru hoga. Stable order aur unique tie-breaker barabar timestamps aur nayi posts ko handle karte hain.", example: "Page one, cursor, page two" },
      { term: "Stale feed entry", what: "Ek taiyar feed entry jo ab sach se match nahi karti, jaise delete hui post ya block hua account.", example: "Hata di gayi post phir bhi listed" },
    ],
  },

  concept: {
    cards: [{
      name: "Fan-out on write",
      examples: ["Post publish hote hi feeds taiyar karo", "Queue aur workers kaam karte hain"],
      moves: ["Feed padhna tez", "Publishing mein zyada kaam", "Bada fan-out mehnga hai aur late ho sakta hai"],
    }, {
      name: "Fan-out on read",
      examples: ["Feed khulne par posts collect karo", "Wahin merge aur sort karo"],
      moves: ["Publishing simple rehti hai", "Padhne mein zyada kaam", "User bahut accounts follow kare toh mehnga"],
    }],
    rule: "Abhi write ka kaam taaki reads tez hon, ya baad mein read ka kaam taaki writes simple hon. Hybrid dono mila deta hai.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Fan-out on write mein kya hota hai?",
      choices: [
        { text: "Creator ke post karte hi system background mein har follower ki feed entries taiyar karta hai", why: "Haan: isse feed kholna tez hota hai, posting ke waqt kaam ki keemat par.", best: true },
        { text: "Follower ke feed kholne tak kuch nahi hota", why: "Yeh fan-out on read hai." },
        { text: "Post seedha follower ke phone par bheji jaati hai", why: "Term ka yeh matlab nahi hai." },
      ],
    },
    {
      id: "post-2",
      prompt: "Fan-out on read ka trade-off kya hai?",
      choices: [
        { text: "Publishing simple rehti hai, par feed kholne par zyada kaam hota hai", why: "Sahi. Kaam read time par chala jaata hai.", best: true },
        { text: "Reading write wale se hamesha tez hoti hai", why: "Aam taur par ulta hota hai: reads collect aur merge karti hain." },
        { text: "Isse database ki zaroorat khatam ho jaati hai", why: "Posts aur follows phir bhi database mein rehte hain." },
      ],
    },
    {
      id: "post-3",
      scenario: "Feed entries background mein jodi ja rahi hain. Ek worker late hai, aur ek hi task do baar aata hai.",
      prompt: "Design ko kya karna chahiye?",
      choices: [
        { text: "Har feed ke turant update hone ka promise nahi, aur stable post aur follower identifiers se entries deduplicate karo", why: "Sahi. Background work late ho sakta hai, aur tasks repeat ho sakte hain.", best: true },
        { text: "Har jagah turant updates ka promise karo", why: "Background work lag kar sakta hai." },
        { text: "Entry do baar dikha do", why: "Duplicates hatane chahiye." },
      ],
    },
    {
      id: "post-4",
      prompt: "Hybrid feed kya karta hai?",
      choices: [
        { text: "Ordinary creators ki posts fan out karta hai aur bahut popular creators ki posts read time par fetch karta hai, phir merge aur deduplicate", why: "Haan. Threshold traffic aur cost measure karke chunna padta hai.", best: true },
        { text: "Har post ko har follower tak hamesha fan out karta hai", why: "Yeh pure fan-out on write hai, jo popular creators ke liye mehnga hai." },
        { text: "Ek fixed magic follower count use karta hai", why: "Koi universal threshold nahi hota." },
      ],
    },
    {
      id: "post-5",
      prompt: "Cursor ke saath stable order aur unique tie-breaker kyun?",
      choices: [
        { text: "Do posts ka timestamp same ho sakta hai, aur pages ke beech nayi posts aa sakti hain, isliye cursor ko stable position chahiye", why: "Sahi. Isse pages ke beech duplicates aur gaps nahi hote.", best: true },
        { text: "Feed ko achha dikhane ke liye", why: "Yeh correctness ki baat hai, looks ki nahi." },
        { text: "Har post ek hi response mein bhejne ke liye", why: "Pagination ek baar mein thodi posts bhejta hai." },
      ],
    },
  ],

  build: {
    title: "Feed approach chuno",
    intro: "Har approach ko us description par drag karo jiske liye woh fit hai. Ya ek tap karo, phir slot tap karo.",
    given: "Ek creator post karta hai",
    rows: [["w", "r"], ["h", "p"]],
    slots: {
      w: { role: "Post publish hote hi har follower ka feed taiyar karo", answer: "write" },
      r: { role: "Feed khulne par recent posts collect aur merge karo", answer: "read" },
      h: { role: "Ordinary creators ke liye taiyar karo, bahut popular ke liye fetch karo", answer: "hybrid" },
      p: { role: "Ek baar mein thodi posts bhejo, agle page ke marker ke saath", answer: "cursor" },
    },
    chips: [
      { id: "write", label: "Fan-out on write", does: "posting ke waqt queue aur workers se follower feeds taiyar karna" },
      { id: "always", label: "Har post ko har follower tak hamesha fan out karo", does: "bade following wale creators ke liye mehnga tareeka" },
      { id: "read", label: "Fan-out on read", does: "feed khulne par recent posts collect aur merge karna" },
      { id: "hybrid", label: "Hybrid", does: "creator ke size ke hisaab se dono mila dena, phir merge aur deduplicate karna" },
      { id: "cursor", label: "Cursor pagination", does: "ek stable position se ek baar mein thode results lautana" },
    ],
    done: "Abhi write ka kaam ya baad mein read ka kaam, dono tarah ke creators ke liye hybrid, aur results ke pages ke liye cursor.",
  },

  canvas: {
    title: "Scratch se draw karo: fan-out on write",
    brief: "Ek creator post publish karta hai. Draw karo woh kaise store hoti hai, kaam background workers tak kaise jaata hai, aur followers ke feeds kaise taiyar aur read hote hain. Har arrow us part se do jo kaam ya request bhejta hai, us part tak jo receive karta hai.",
    parts: ["client", "server", "database", "queue", "worker", "feed", "cache", "lb"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.08, y: 0.18 }, { id: "s", part: "server", x: 0.34, y: 0.18 },
        { id: "d", part: "database", x: 0.78, y: 0.18 }, { id: "q", part: "queue", x: 0.34, y: 0.58 },
        { id: "w", part: "worker", x: 0.62, y: 0.58 }, { id: "f", part: "feed", x: 0.62, y: 0.88 },
      ],
      edges: [["c", "s"], ["s", "d"], ["s", "q"], ["q", "w"], ["w", "f"], ["s", "f"]],
    },
    why: {
      "client>server": "Creator ka client post app server ko bhejta hai.",
      "server>database": "Post aur uska owner database mein save hote hain, jo authoritative record hai.",
      "server>queue": "Server fan-out ka kaam queue mein daalta hai, taaki creator ko har follower ke feed ka wait na karna pade.",
      "queue>worker": "Workers queue se jobs background mein uthate hain.",
      "worker>feed": "Worker har follower ki feed entries mein post ID jodta hai. Isme delay ho sakti hai, aur duplicates handle karne padte hain.",
      "server>feed": "Follower jab feed kholta hai, server taiyar entries padhta hai, phir post details laata hai aur access check karta hai.",
    },
    done: "Post store hoti hai, queue aur workers background mein followers ke feeds taiyar karte hain, aur feed kholna ek quick read hai. Database source of truth rehta hai.",
  },

  followUps: [
    {
      q: "“Design a social feed.”",
      answer: [
        "Pehle scope clarify karo: chronological ya ranked, aur kya out of scope hai.",
        "Posts aur follow relationships store karo. Common creators ke liye fan-out on write consider karo, aur high-follower creators ke liye read-time fetch, hybrid ke roop mein.",
        "Privacy, pagination aur background delays handle karo.",
      ],
      say: "“Main feed type clarify karunga, posts aur follows store karunga, fan-out on write aur read ka hybrid use karunga, aur privacy, pagination aur delays handle karunga.”",
      deeper: "Days 14 aur 15",
    },
    {
      q: "“Har post ko har follower tak fan out kyun nahi karte?”",
      answer: [
        "10 lakh followers wale creator ki ek post ka matlab up to 10 lakh feed entries ho sakta hai.",
        "Yeh mehnga aur slow ho sakta hai, khaaskar agar bahut followers kam active hon.",
        "Isliye bahut popular creators ki posts read time par fetch karo, aur merge karo.",
      ],
      say: "“Bada fan-out mehnga hai, isliye main bahut popular creators ki posts read time par fetch karunga aur taiyar feed ke saath merge karunga.”",
    },
    {
      q: "“Post delete ho gayi ya user block ho gaya. Feeds ka kya hoga?”",
      answer: [
        "Feed entries ek convenience hain. Original post authoritative record hai.",
        "Stale entries handle karo, aur results lautane se pehle access rules enforce karo.",
        "Privacy, blocks aur visibility changes ka dhyan rakho.",
      ],
      say: "“Feed entries ek convenience hain. Kuch lautane se pehle main original post aur access rules check karunga.”",
    },
  ],

  faq: [
    { q: "Kya koi real social app aise kaam karti hai?", a: "Nahi. Yeh ek fictional teaching example hai, kisi company ke internal design ka claim nahi." },
    { q: "Hybrid ke liye sahi follower threshold kya hai?", a: "Koi universal magic number nahi hai. Aap use traffic aur cost measure karke chunte ho." },
    { q: "Kya har follower ka feed turant update ho jayega?", a: "Iska promise mat karo. Background work late ho sakta hai aur tasks repeat ho sakte hain, isliye deduplicate karo." },
  ],

  interview: [
    "Scope clarify karo: chronological ya ranked, aur kya out hai.",
    "Posts aur follow relationships store karo; post authoritative record hai.",
    "Fan-out on write aur read compare karo, aur hybrid propose karo.",
    "Privacy, blocks aur stale feed entries handle karo.",
    "Cursor pagination aur background delay add karo.",
  ],

  cheatsheet: {
    title: "Day 12 · Social feed design",
    points: [
      "Pehle scope clarify karo: chronological following feed",
      "Posts aur follows source of truth hain",
      "Fan-out on write: tez reads, posting ke waqt kaam",
      "Fan-out on read: simple writes, read ke waqt kaam",
      "Hybrid: ordinary creators write, popular read; merge aur deduplicate",
      "Privacy aur blocks ka dhyan; stable cursor se pages",
    ],
  },

  linkedin:
    "Day 12/21: System Design Essentials with Klymb.\n\nEk post kai feeds tak kaise pahunchti hai? Fan-out on write publish hote hi follower feeds taiyar karta hai; fan-out on read feed khulne par posts collect karta hai. Bade following wale creators ke liye hybrid unhe read time par fetch karta hai.\n\nPrivacy, blocks, background delays aur pages ke liye stable cursor mat bhoolna.\n\n#SystemDesign #Klymb",

  nextDay: "Day 13: problem ulta hai. Bahut saare users ek hi seat chahte hain. Use do logon ko jaane se kaise rokein?",
};

export const essentialsDayTwelve: Day = {
  day: 12,
  of: 21,
  app: "A social app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-12.mp4", poster: "/videos/system-design/essentials-day-12-poster.jpg", minutes: 5, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-12.mp4", poster: "/videos/system-design/essentials-day-12-poster.jpg" },
  },
};
