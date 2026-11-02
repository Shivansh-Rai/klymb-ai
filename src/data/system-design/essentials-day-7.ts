/**
 * Day 7 of "System Design Essentials": replication, sharding and consistency.
 * Built from the Day 7 video script. The shop and its databases are fictional
 * teaching examples, not any company's real design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 7 · Replication and sharding",
  hookLines: [
    "The shop keeps growing.",
    "Even with a cache and better queries, the database is under heavy load.",
    "Should we split the data across databases right away?",
  ],
  question: "Not so fast. What would you check first?",

  pre: [
    {
      id: "pre-1",
      scenario: "After caching and query tuning, the database is still heavily loaded.",
      prompt: "Should you shard the data immediately?",
      choices: [
        { text: "No: first find the problem: a slow query, read traffic, write traffic, or storage", why: "Right. Different problems have different answers, so measure before choosing.", best: true },
        { text: "Yes: sharding fixes every database problem", why: "It adds complexity and doesn’t solve every bottleneck." },
        { text: "Yes: user count tells us we need shards", why: "The user count alone doesn’t decide it. The measured workload does." },
      ],
    },
    {
      id: "pre-2",
      scenario: "A shopper saves a new delivery address. The next page still shows the old one, because that read came from a replica.",
      prompt: "What is happening?",
      choices: [
        { text: "Replication lag: the replica hasn’t applied the change yet", why: "Right. The primary has it; the replica catches up a little later.", best: true },
        { text: "The save failed", why: "The save worked on the primary. The read just came from a copy that was behind." },
        { text: "The shopper’s phone is broken", why: "Nothing points at the client." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Someone says: “We have a replica, so we don’t need backups.”",
      prompt: "Is that right?",
      choices: [
        { text: "No: a wrong change or deletion can reach the replica too, so backup and restore are separate", why: "Right. A replica follows changes, including unwanted ones.", best: true },
        { text: "Yes: a replica is a backup", why: "It copies changes, bad ones included." },
        { text: "Yes, as long as there are two replicas", why: "More replicas follow the same changes." },
      ],
    },
  ],

  revealTitle: "When the database grows",
  revealSub: "a fictional shop, a simplified design",
  reveal: [
    { when: "Measure first", what: "A slow query may need an index. Repeated reads may need a cache. Only if the workload shows the need do we evaluate replication or sharding." },
    { when: "Replication", what: "One primary database takes the writes, and replicas hold copies of its data. When requirements allow, some reads can be served by replicas." },
    { when: "Replication lag", what: "If a replica hasn’t applied a change yet, a read from it can show the old value. That’s a consistency concern: how the data should look across reads." },
    { when: "Read-your-writes", what: "To show someone their own saved change at once, their follow-up read can be served by the primary. It adds primary load and routing complexity." },
    { when: "Sharding", what: "The data is split into partitions, shards, by a routing rule. A user’s record lives on one shard, and the system must know which. No copies are implied." },
    { when: "Shard key and hot partitions", what: "The shard key decides where a record goes. If one user’s traffic is huge, their shard can become hot. Look at request distribution as well as data size." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Primary and replica", what: "The primary takes the writes. Replicas keep copies of its data, and can serve some reads when requirements allow.", example: "Writes to the primary, reads from replicas" },
      { term: "Replication lag", what: "The delay before a change reaches, or is applied on, a replica.", example: "The old address shows for a moment" },
      { term: "Consistency", what: "How the data should look across different reads.", example: "Do I see the address I just saved?" },
      { term: "Read-your-writes", what: "The requirement that a user sees their own successfully saved change straight away.", example: "Serve that follow-up read from the primary" },
      { term: "Sharding and shard key", what: "Splitting data into partitions (shards). The shard key is the field or fields that decide which shard a record goes to.", example: "User ID decides shard A or B" },
      { term: "Hot partition", what: "A shard that gets far more traffic than the others, because one key’s work concentrates there.", example: "One extremely active user" },
    ],
  },

  concept: {
    cards: [{
      name: "Replication: copies",
      examples: ["A primary and read replicas", "Copies of the same data"],
      moves: ["Adds read-serving capacity", "Brings replication lag", "Writes still go to the primary; a replica isn’t a backup"],
    }, {
      name: "Sharding: parts",
      examples: ["Shard A and shard B", "Each record on one shard"],
      moves: ["Spreads data and load", "Brings routing and cross-shard complexity", "A shard key must fit the workload"],
    }],
    rule: "Copies of data and partitions of data are different decisions. Measure first.",
  },

  post: [
    {
      id: "post-1",
      prompt: "What’s the difference between replication and sharding?",
      choices: [
        { text: "Replication keeps copies of the data; sharding divides the data into parts", why: "Yes: copies versus partitions.", best: true },
        { text: "They are two names for the same thing", why: "They solve different problems." },
        { text: "Replication divides the data; sharding copies it", why: "That’s the other way round." },
      ],
    },
    {
      id: "post-2",
      prompt: "Which reads can a replica serve?",
      choices: [
        { text: "Reads that can tolerate data being slightly behind, when requirements allow", why: "Right. First ask whether the read needs the very latest value.", best: true },
        { text: "Every read, always", why: "A read that must see the latest change may need the primary." },
        { text: "Only writes", why: "Writes go to the primary." },
      ],
    },
    {
      id: "post-3",
      scenario: "After a user saves their address, they must see it straight away.",
      prompt: "What’s one design that helps?",
      choices: [
        { text: "Serve that user’s relevant follow-up read from the primary", why: "Yes: it’s read-your-writes. The trade-off is extra primary load and routing complexity.", best: true },
        { text: "Ignore it: replicas are always up to date", why: "Replicas can lag." },
        { text: "Delete the replica", why: "That doesn’t make the design correct." },
      ],
    },
    {
      id: "post-4",
      scenario: "Data is sharded by user ID. One exceptionally active user sends most of the traffic to a single shard.",
      prompt: "What is this called?",
      choices: [
        { text: "A hot partition", why: "Right: one shard is far busier than the others.", best: true },
        { text: "Replication lag", why: "That’s a delay between primary and replica." },
        { text: "A cache hit", why: "That’s about caches." },
      ],
    },
    {
      id: "post-5",
      scenario: "A single query is slow. Everything else looks fine.",
      prompt: "What’s the first thing to look at?",
      choices: [
        { text: "The query and its index", why: "Yes: a slow query is usually helped by the query and index before anything bigger.", best: true },
        { text: "Sharding the whole database", why: "That’s far more than this problem needs." },
        { text: "Adding a replica", why: "That helps read traffic, not one slow query." },
      ],
    },
  ],

  build: {
    title: "Match the problem to the first move",
    intro: "Drag each move to the situation it fits first. You can also tap a move, then tap a slot.",
    given: "The database is under load",
    rows: [["slow", "reads"], ["data"]],
    slots: {
      slow: { role: "One slow query", answer: "tune" },
      reads: { role: "Lots of reads that can tolerate a little lag", answer: "replica" },
      data: { role: "Measured data and writes beyond one database", answer: "shard" },
    },
    chips: [
      { id: "shard", label: "Evaluate sharding", does: "splitting data into shards, with a shard key and cross-shard costs to weigh" },
      { id: "backup", label: "Treat a replica as the backup", does: "a mistake: a replica follows bad changes too" },
      { id: "tune", label: "Check the query and index", does: "fixing a slow query at its source" },
      { id: "replica", label: "Evaluate read replicas", does: "serving eligible reads from copies, with replication lag in mind" },
    ],
    done: "Query first for a slow query, replicas for eligible reads, sharding when measured data and writes need it.",
  },

  canvas: {
    title: "Draw it from scratch: a primary and a read replica",
    brief: "The app server needs to read and write. Draw one primary database that takes the writes, a read replica that serves some reads, and the way changes reach the replica. Point each arrow from the part that asks, or sends, to the part that receives.",
    parts: ["server", "database", "replica", "cache", "queue", "lb"],
    model: {
      nodes: [
        { id: "s", part: "server", x: 0.14, y: 0.5 }, { id: "d", part: "database", x: 0.55, y: 0.2 },
        { id: "r", part: "replica", x: 0.55, y: 0.82 },
      ],
      edges: [["s", "d"], ["s", "r"], ["d", "r"]],
    },
    why: {
      "server>database": "Writes go to the primary database, which holds the authoritative data.",
      "server>replica": "Reads that can tolerate a little lag can go to a replica, which spreads the read load.",
      "database>replica": "The primary sends its changes to the replica. That takes a moment, which is replication lag.",
    },
    done: "Writes to the primary, eligible reads to the replica, and changes flowing from the primary to the replica. A replica isn’t a backup, and sharding is a separate decision.",
  },

  followUps: [
    {
      q: "“Is a replica a backup?”",
      answer: [
        "No. A replica can follow changes, including unwanted ones.",
        "A wrong change or deletion can reach it too.",
        "A separate backup and restore strategy is needed.",
      ],
      say: "“No. A replica follows changes, unwanted ones included, so I’d have a separate backup and restore strategy.”",
    },
    {
      q: "“I updated my address, but a replica still shows the old one. Why?”",
      answer: [
        "That’s replication lag: the replica hasn’t applied the change yet.",
        "It’s a consistency concern about how reads should look.",
        "One option is read-your-writes: serve that user’s follow-up read from the primary, accepting extra primary load and routing complexity.",
      ],
      say: "“It’s replication lag. If the user must see their own change, I can serve their follow-up read from the primary and accept the extra load.”",
      deeper: "Day 13",
    },
    {
      q: "“When would you use replicas, and when would you shard?”",
      answer: [
        "A slow query: look at the query and index first.",
        "Lots of eligible reads that tolerate lag: evaluate replicas, and check the freshness need.",
        "Measured data and write distribution beyond one database: evaluate sharding, with the shard key and cross-shard costs.",
      ],
      say: "“Query first, replicas for eligible reads with lag in mind, and sharding only when measured data and writes need it, weighing the shard key and cross-shard costs.”",
    },
  ],

  faq: [
    { q: "Does sharding fix every database bottleneck?", a: "No. It can spread aggregate load, but it brings routing, rebalancing and cross-shard complexity, and no guarantee that every system needs it or that it solves every bottleneck." },
    { q: "Do read replicas help writes?", a: "No. In our example, writes still go to the primary, so adding read replicas doesn’t fix a write bottleneck." },
    { q: "Do shards have replicas too?", a: "They can, but that’s a separate design decision from sharding itself." },
  ],

  interview: [
    "Say what you’d measure first: query, reads, writes or storage.",
    "Replication copies the data; sharding divides it.",
    "Mention replication lag and read-your-writes.",
    "Say a replica isn’t a backup.",
    "For sharding, name the shard key and the hot-partition risk.",
  ],

  cheatsheet: {
    title: "Day 7 · Replication and sharding",
    points: [
      "Measure first: query, reads, writes or storage",
      "Replication: copies. Sharding: parts",
      "Replicas can lag; a user may see old data",
      "Read-your-writes: serve that read from the primary",
      "A replica isn’t a backup",
      "A shard key must fit the workload; watch for hot partitions",
    ],
  },

  linkedin:
    "Day 7/21 of System Design Essentials with Klymb.\n\nWhen the database is heavy, don’t reach for sharding first. Measure: a slow query, read traffic, write traffic or storage.\n\nReplication keeps copies (and brings replication lag); sharding divides the data (and needs a good shard key). A replica isn’t a backup.\n\n#SystemDesign #Klymb",

  nextDay: "Day 8: after an order is placed, should the user wait for the email, the notification and every background task?",
};

const hi: DayCopy = {
  tag: "Day 7 · Replication aur sharding",
  hookLines: [
    "Shop badhti ja rahi hai.",
    "Cache aur behtar queries ke baad bhi database par bhaari load hai.",
    "Kya hume turant data ko alag databases mein baant dena chahiye?",
  ],
  question: "Itni jaldi nahi. Pehle kya check karoge?",

  pre: [
    {
      id: "pre-1",
      scenario: "Caching aur query tuning ke baad bhi database par bhaari load hai.",
      prompt: "Kya turant data ko shard kar dena chahiye?",
      choices: [
        { text: "Nahi: pehle problem dhoondo: slow query, read traffic, write traffic, ya storage", why: "Sahi. Alag problems ke answers alag hote hain, isliye chunne se pehle measure karo.", best: true },
        { text: "Haan: sharding har database problem theek kar deti hai", why: "Woh complexity laati hai aur har bottleneck solve nahi karti." },
        { text: "Haan: user count batata hai ki shards chahiye", why: "Sirf user count decide nahi karta. Measured workload karta hai." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Shopper naya delivery address save karta hai. Agla page ab bhi purana dikhata hai, kyunki woh read replica se aayi thi.",
      prompt: "Yeh kya ho raha hai?",
      choices: [
        { text: "Replication lag: replica ne abhi change apply nahi kiya", why: "Sahi. Primary ke paas hai; replica thodi der baad pakadta hai.", best: true },
        { text: "Save fail ho gaya", why: "Save primary par ho gaya. Read bas ek aisi copy se aayi jo peeche thi." },
        { text: "Shopper ka phone kharab hai", why: "Kuch client ki taraf ishara nahi karta." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Koi kehta hai: “Hamare paas replica hai, isliye backups ki zaroorat nahi.”",
      prompt: "Kya yeh sahi hai?",
      choices: [
        { text: "Nahi: galat change ya deletion replica tak bhi pahunch sakta hai, isliye backup aur restore alag chahiye", why: "Sahi. Replica changes follow karta hai, unwanted changes bhi.", best: true },
        { text: "Haan: replica ek backup hai", why: "Woh changes copy karta hai, kharab wale bhi." },
        { text: "Haan, agar do replicas hon", why: "Zyada replicas wahi changes follow karte hain." },
      ],
    },
  ],

  revealTitle: "Jab database bada hota hai",
  revealSub: "ek fictional shop, simplified design",
  reveal: [
    { when: "Pehle measure", what: "Slow query ko index chahiye ho sakta hai. Repeated reads ko cache. Workload ki zaroorat dikhe tabhi replication ya sharding evaluate karo." },
    { when: "Replication", what: "Ek primary database writes leta hai, aur replicas uske data ki copies rakhte hain. Requirements allow karein toh kuch reads replicas se serve ho sakti hain." },
    { when: "Replication lag", what: "Agar replica ne abhi change apply nahi kiya, toh usse padhne par purani value dikh sakti hai. Yeh consistency concern hai: alag reads mein data kaisa dikhna chahiye." },
    { when: "Read-your-writes", what: "Kisi ko uska khud ka saved change turant dikhane ke liye, uski follow-up read primary se serve ho sakti hai. Isse primary load aur routing complexity badhti hai." },
    { when: "Sharding", what: "Data ko routing rule se partitions, yaani shards, mein baanta jaata hai. User ka record ek shard par rehta hai, aur system ko pata hona chahiye kaunsa. Copies nahi banti." },
    { when: "Shard key aur hot partitions", what: "Shard key decide karti hai record kahan jaayega. Agar ek user ka traffic bahut zyada ho, toh uska shard hot ho sakta hai. Data size ke saath request distribution bhi dekho." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Primary aur replica", what: "Primary writes leta hai. Replicas uske data ki copies rakhte hain, aur requirements allow karein toh kuch reads serve kar sakte hain.", example: "Writes primary ko, reads replicas se" },
      { term: "Replication lag", what: "Change ke replica tak pahunchne ya wahan apply hone se pehle ki delay.", example: "Thodi der purana address dikhta hai" },
      { term: "Consistency", what: "Alag reads mein data kaisa dikhna chahiye.", example: "Kya mujhe wahi address dikh raha hai jo maine save kiya?" },
      { term: "Read-your-writes", what: "Requirement ki user ko uska khud ka successfully saved change turant dikhe.", example: "Woh follow-up read primary se serve karo" },
      { term: "Sharding aur shard key", what: "Data ko partitions (shards) mein baantna. Shard key woh field ya fields hain jo decide karti hain ki record kaunse shard mein jaayega.", example: "User ID decide kare shard A ya B" },
      { term: "Hot partition", what: "Aisa shard jise doosron se kaafi zyada traffic mile, kyunki ek key ka kaam wahin concentrate hota hai.", example: "Ek bahut active user" },
    ],
  },

  concept: {
    cards: [{
      name: "Replication: copies",
      examples: ["Ek primary aur read replicas", "Wahi data ki copies"],
      moves: ["Read-serving capacity badhati hai", "Replication lag aata hai", "Writes phir bhi primary ko jaate hain; replica backup nahi"],
    }, {
      name: "Sharding: parts",
      examples: ["Shard A aur shard B", "Har record ek shard par"],
      moves: ["Data aur load ko failata hai", "Routing aur cross-shard complexity aati hai", "Shard key workload ke hisaab se honi chahiye"],
    }],
    rule: "Data ki copies aur data ke partitions alag decisions hain. Pehle measure karo.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Replication aur sharding mein kya difference hai?",
      choices: [
        { text: "Replication data ki copies rakhti hai; sharding data ko parts mein baantti hai", why: "Haan: copies versus partitions.", best: true },
        { text: "Dono ek hi cheez ke do naam hain", why: "Dono alag problems solve karte hain." },
        { text: "Replication data baantti hai; sharding copy karti hai", why: "Yeh ulta hai." },
      ],
    },
    {
      id: "post-2",
      prompt: "Replica kaunsi reads serve kar sakta hai?",
      choices: [
        { text: "Woh reads jo data thoda peeche hone ko tolerate kar sakti hain, jab requirements allow karein", why: "Sahi. Pehle poochho ki kya us read ko bilkul latest value chahiye.", best: true },
        { text: "Har read, hamesha", why: "Jis read ko latest change dikhna ho use primary ki zaroorat ho sakti hai." },
        { text: "Sirf writes", why: "Writes primary ko jaati hain." },
      ],
    },
    {
      id: "post-3",
      scenario: "User apna address save karta hai, aur use woh turant dikhna chahiye.",
      prompt: "Ek design jo madad karta hai?",
      choices: [
        { text: "Us user ki relevant follow-up read primary se serve karo", why: "Haan: yeh read-your-writes hai. Trade-off hai extra primary load aur routing complexity.", best: true },
        { text: "Ignore karo: replicas hamesha up to date hote hain", why: "Replicas lag kar sakte hain." },
        { text: "Replica delete kar do", why: "Isse design sahi nahi ho jaata." },
      ],
    },
    {
      id: "post-4",
      scenario: "Data user ID se shard hai. Ek bahut active user zyaadatar traffic ek hi shard ko bhejta hai.",
      prompt: "Ise kya kehte hain?",
      choices: [
        { text: "Hot partition", why: "Sahi: ek shard doosron se kaafi zyada busy hai.", best: true },
        { text: "Replication lag", why: "Woh primary aur replica ke beech ki delay hai." },
        { text: "Cache hit", why: "Woh caches ki baat hai." },
      ],
    },
    {
      id: "post-5",
      scenario: "Ek single query slow hai. Baaki sab theek lag raha hai.",
      prompt: "Sabse pehle kya dekhna chahiye?",
      choices: [
        { text: "Query aur uska index", why: "Haan: slow query ko aam taur par kisi bade kadam se pehle query aur index se madad milti hai.", best: true },
        { text: "Poore database ko shard karna", why: "Is problem ke liye woh bahut zyada hai." },
        { text: "Replica add karna", why: "Woh read traffic ke liye madad karta hai, ek slow query ke liye nahi." },
      ],
    },
  ],

  build: {
    title: "Problem ko pehle kadam se match karo",
    intro: "Har move ko us situation par drag karo jiske liye woh pehle fit hota hai. Ya move tap karo, phir slot tap karo.",
    given: "Database par load hai",
    rows: [["slow", "reads"], ["data"]],
    slots: {
      slow: { role: "Ek slow query", answer: "tune" },
      reads: { role: "Bahut saari reads jo thoda lag tolerate kar sakti hain", answer: "replica" },
      data: { role: "Measured data aur writes ek database se aage", answer: "shard" },
    },
    chips: [
      { id: "shard", label: "Sharding evaluate karo", does: "data ko shards mein baantna, shard key aur cross-shard costs ke saath" },
      { id: "backup", label: "Replica ko backup maano", does: "galti: replica kharab changes bhi follow karta hai" },
      { id: "tune", label: "Query aur index dekho", does: "slow query ko uski jad par theek karna" },
      { id: "replica", label: "Read replicas evaluate karo", does: "eligible reads ko copies se serve karna, replication lag ka dhyan rakhte hue" },
    ],
    done: "Slow query ke liye pehle query, eligible reads ke liye replicas, aur sharding tab jab measured data aur writes ko zaroorat ho.",
  },

  canvas: {
    title: "Scratch se draw karo: primary aur read replica",
    brief: "App server ko padhna aur likhna hai. Ek primary database draw karo jo writes leta hai, ek read replica jo kuch reads serve karta hai, aur woh raasta jisse changes replica tak pahunchte hain. Har arrow us part se do jo poochta ya bhejta hai, us part tak jo receive karta hai.",
    parts: ["server", "database", "replica", "cache", "queue", "lb"],
    model: {
      nodes: [
        { id: "s", part: "server", x: 0.14, y: 0.5 }, { id: "d", part: "database", x: 0.55, y: 0.2 },
        { id: "r", part: "replica", x: 0.55, y: 0.82 },
      ],
      edges: [["s", "d"], ["s", "r"], ["d", "r"]],
    },
    why: {
      "server>database": "Writes primary database ko jaati hain, jiske paas authoritative data hai.",
      "server>replica": "Jo reads thoda lag tolerate kar sakti hain woh replica ko ja sakti hain, jisse read load baant jaata hai.",
      "database>replica": "Primary apne changes replica ko bhejta hai. Isme thodi der lagti hai, yahi replication lag hai.",
    },
    done: "Writes primary ko, eligible reads replica ko, aur changes primary se replica tak. Replica backup nahi hai, aur sharding alag decision hai.",
  },

  followUps: [
    {
      q: "“Kya replica backup hai?”",
      answer: [
        "Nahi. Replica changes follow kar sakta hai, unwanted changes bhi.",
        "Galat change ya deletion uske paas bhi pahunch sakta hai.",
        "Alag backup aur restore strategy chahiye.",
      ],
      say: "“Nahi. Replica changes follow karta hai, unwanted bhi, isliye main alag backup aur restore strategy rakhunga.”",
    },
    {
      q: "“Maine address update kiya, par replica par purana dikh raha hai. Kyun?”",
      answer: [
        "Yeh replication lag hai: replica ne abhi change apply nahi kiya.",
        "Yeh consistency concern hai ki reads kaisi dikhni chahiye.",
        "Ek option read-your-writes hai: us user ki follow-up read primary se serve karo, extra primary load aur routing complexity maanke.",
      ],
      say: "“Yeh replication lag hai. Agar user ko apna change dikhna zaroori ho, toh main uski follow-up read primary se serve karunga aur extra load maanunga.”",
      deeper: "Day 13",
    },
    {
      q: "“Replicas kab use karoge, aur sharding kab?”",
      answer: [
        "Slow query: pehle query aur index dekho.",
        "Bahut saari eligible reads jo lag tolerate karti hain: replicas evaluate karo, aur freshness ki zaroorat check karo.",
        "Measured data aur write distribution ek database se aage: sharding evaluate karo, shard key aur cross-shard costs ke saath.",
      ],
      say: "“Pehle query, eligible reads ke liye replicas lag ka dhyan rakhte hue, aur sharding tabhi jab measured data aur writes ko chahiye, shard key aur cross-shard costs tolte hue.”",
    },
  ],

  faq: [
    { q: "Kya sharding har database bottleneck theek kar deti hai?", a: "Nahi. Woh aggregate load failane mein madad kar sakti hai, par routing, rebalancing aur cross-shard complexity laati hai, aur guarantee nahi ki har system ko chahiye ya har bottleneck solve ho." },
    { q: "Kya read replicas writes mein madad karte hain?", a: "Nahi. Hamare example mein writes phir bhi primary ko jaati hain, isliye read replicas add karne se write bottleneck theek nahi hota." },
    { q: "Kya shards ke bhi replicas hote hain?", a: "Ho sakte hain, par woh sharding se alag design decision hai." },
  ],

  interview: [
    "Batao pehle kya measure karoge: query, reads, writes ya storage.",
    "Replication data copy karti hai; sharding use baantti hai.",
    "Replication lag aur read-your-writes mention karo.",
    "Batao replica backup nahi hai.",
    "Sharding mein shard key aur hot-partition ka risk batao.",
  ],

  cheatsheet: {
    title: "Day 7 · Replication aur sharding",
    points: [
      "Pehle measure: query, reads, writes ya storage",
      "Replication: copies. Sharding: parts",
      "Replicas lag kar sakte hain; user ko purana data dikh sakta hai",
      "Read-your-writes: woh read primary se serve karo",
      "Replica backup nahi hai",
      "Shard key workload ke hisaab se ho; hot partitions se bacho",
    ],
  },

  linkedin:
    "Day 7/21: System Design Essentials with Klymb.\n\nDatabase bhaari ho toh sabse pehle sharding mat chuno. Measure karo: slow query, read traffic, write traffic ya storage.\n\nReplication copies rakhti hai (aur replication lag laati hai); sharding data baantti hai (aur achhi shard key chahiye). Replica backup nahi hai.\n\n#SystemDesign #Klymb",

  nextDay: "Day 8: order place hone ke baad, kya user ko email, notification aur har background task ka wait karna chahiye?",
};

export const essentialsDaySeven: Day = {
  day: 7,
  of: 21,
  app: "A shopping app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-7.mp4", poster: "/videos/system-design/essentials-day-7-poster.jpg", minutes: 6, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-7.mp4", poster: "/videos/system-design/essentials-day-7-poster.jpg" },
  },
};
