/**
 * Day 6 of "System Design Essentials": caching, and keeping cached data fresh.
 * Built from the Day 6 video script. The shop, its numbers and its timers are
 * fictional teaching examples, not any company's real design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 6 · Caching and CDNs",
  hookLines: [
    "The sale is on, and thousands open the same popular shoe.",
    "Every request asks the database for the same description.",
    "Does the database have to do the same work every time?",
  ],
  question: "Could that repeated work be reduced? And what if the saved copy gets out of date?",

  pre: [
    {
      id: "pre-1",
      scenario: "Thousands of shoppers open the same popular product page. Each request asks the database for the same description.",
      prompt: "What could reduce the repeated work?",
      choices: [
        { text: "Keep a temporary copy of the frequently read data, while the database stays the source of truth", why: "Yes. That’s a cache: a temporary copy for faster reuse.", best: true },
        { text: "Remove the database and keep everything in memory", why: "The database is the authoritative source. A copy can’t replace it." },
        { text: "Ask shoppers to wait", why: "That doesn’t reduce the repeated work." },
      ],
    },
    {
      id: "pre-2",
      scenario: "The product description is updated in the database, but the cache still holds the old copy.",
      prompt: "What is this called?",
      choices: [
        { text: "Stale data: an older cached value", why: "Right. The cache is behind the source.", best: true },
        { text: "A cache hit", why: "A hit means the data was found in the cache. Here the question is whether it’s up to date." },
        { text: "A bottleneck", why: "That’s a limiting stage, not out-of-date data." },
      ],
    },
    {
      id: "pre-3",
      scenario: "A product page showed a cached price. The shopper now goes to checkout.",
      prompt: "What should checkout do?",
      choices: [
        { text: "Validate price and stock against the authoritative rules and the current state", why: "Right. A cached display isn’t proof the purchase can go through at that price.", best: true },
        { text: "Trust the cached price", why: "It may be stale." },
        { text: "Skip the check to be faster", why: "Checkout is where correctness matters most." },
      ],
    },
  ],

  revealTitle: "Product 123, with and without a cache",
  revealSub: "a fictional shop, a simplified design",
  reveal: [
    { when: "The cache", what: "A cache sits next to the app server and holds a temporary copy of frequently needed data. The database stays: it’s the source for the product record." },
    { when: "Cache miss", what: "The app looks for product 123 in the cache and finds nothing. It reads the database, puts a copy in the cache, and answers the user." },
    { when: "Cache hit", what: "The next request finds product 123 in the cache, and the app answers from it. This is cache-aside." },
    { when: "Other layers", what: "A CDN can serve cacheable content such as an image from different locations. The image’s path doesn’t have to be the product data’s path." },
    { when: "Stale data", what: "If the description changes in the database but the cache keeps the old copy, users can see old information. Price and stock at checkout need the authoritative state." },
    { when: "Freshness and failure", what: "A TTL expires entries after a time; invalidation removes them when data changes. A popular entry expiring can cause a stampede, and a cache outage can overload the database." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Cache", what: "A place that keeps a temporary copy of frequently needed information for faster reuse, so the original isn’t asked every time.", example: "Product 123’s description" },
      { term: "Cache hit / miss", what: "A hit: the data is in the cache. A miss: it isn’t, so the app reads the source and fills the cache.", example: "First request misses, the next hits" },
      { term: "Cache-aside", what: "The app checks the cache; on a miss it loads from the source and fills the cache.", example: "Check, miss, read database, fill, answer" },
      { term: "Stale data", what: "An older cached value that no longer matches the source.", example: "An old product description" },
      { term: "TTL and invalidation", what: "TTL (time to live): an entry expires after a set time. Invalidation: removing or marking an entry when the data changes. Neither guarantees perfect freshness.", example: "An example 60-second TTL" },
      { term: "Cache stampede", what: "A popular entry expires and many requests miss at once, putting pressure on the database.", example: "A popular product during a sale" },
    ],
  },

  concept: {
    cards: [{
      name: "What a cache gives",
      examples: ["Fewer repeated reads of the source", "Faster responses for popular data"],
      moves: ["Keep the source of truth visible", "Cache what’s read often", "Decide what staleness is acceptable"],
    }, {
      name: "What a cache costs",
      examples: ["Data can be stale", "One more component to run"],
      moves: ["Freshness has to be managed", "Plan for misses, expiry and failure", "Check price and stock at checkout"],
    }],
    rule: "A cache is a temporary copy. The database is still the source of truth.",
  },

  post: [
    {
      id: "post-1",
      scenario: "The app looks for product 123 in the cache and finds no entry.",
      prompt: "What is this called, and what happens next?",
      choices: [
        { text: "A cache miss: the app reads the database, fills the cache and answers", why: "Yes: that’s the cache-aside flow.", best: true },
        { text: "A cache hit: the app answers from the cache", why: "A hit is when the entry is found." },
        { text: "A failure: the app gives up", why: "A miss is normal. It just means loading from the source." },
      ],
    },
    {
      id: "post-2",
      prompt: "What does a 60-second TTL mean in our example?",
      choices: [
        { text: "The entry expires after 60 seconds, so a later read may need to fetch fresh data", why: "Right. It’s an example setting, not a guarantee, and not right for every product.", best: true },
        { text: "The data is always fresh for 60 seconds, no matter what", why: "If the source changes sooner, the cache can still be stale." },
        { text: "The database is deleted after 60 seconds", why: "No: only the cached entry expires." },
      ],
    },
    {
      id: "post-3",
      scenario: "A popular product’s entry expires in the middle of a sale and many requests miss together.",
      prompt: "What is this called?",
      choices: [
        { text: "A cache stampede", why: "Yes: many misses at once put pressure on the database.", best: true },
        { text: "A cache hit", why: "A hit is the opposite: the entry is found." },
        { text: "Vertical scaling", why: "That’s about adding resources to one server." },
      ],
    },
    {
      id: "post-4",
      prompt: "Which of these should be revalidated at checkout instead of trusted from a cached page?",
      choices: [
        { text: "Price and stock", why: "Yes: checkout validates them against the authoritative rules and current state.", best: true },
        { text: "The shoe’s colour name", why: "A slightly old description is usually acceptable." },
        { text: "The page title", why: "That isn’t something a purchase depends on." },
      ],
    },
    {
      id: "post-5",
      prompt: "“The cache is fast, so let’s remove the database.” What’s wrong with that?",
      choices: [
        { text: "The cache is a temporary copy; the database is the authoritative source and is needed on misses, expiry and failure", why: "Right.", best: true },
        { text: "Nothing: caches are better than databases", why: "A cache can’t replace the source of truth." },
        { text: "Databases are faster than caches", why: "That isn’t the point: they have different jobs." },
      ],
    },
  ],

  build: {
    title: "Follow product 123 through the cache",
    intro: "Put the steps in order. You can also tap a step, then tap a slot.",
    given: "A shopper opens product 123",
    rows: [["check", "read", "fill"], ["hit", "expire"]],
    rowLabels: ["The first request (a miss)", "After that"],
    slots: {
      check: { role: "The app looks in the cache first", answer: "check" },
      read: { role: "Nothing there, so read the source", answer: "read" },
      fill: { role: "Keep a copy for the next request", answer: "fill" },
      hit: { role: "The next request finds it and answers", answer: "hit" },
      expire: { role: "After the TTL, the next read fetches fresh data", answer: "expire" },
    },
    chips: [
      { id: "fill", label: "Fill the cache", does: "putting a copy of the product in the cache for later requests" },
      { id: "drop", label: "Remove the database", does: "losing the source of truth, which a cache can’t replace" },
      { id: "check", label: "Check the cache", does: "looking for the entry before asking the source" },
      { id: "hit", label: "Answer from the cache (hit)", does: "serving the data from the temporary copy" },
      { id: "read", label: "Read the database (miss)", does: "loading the product from the authoritative source" },
      { id: "expire", label: "TTL expires the entry", does: "ending the copy’s life so a later read can fetch fresh data" },
    ],
    done: "Check, miss, read the source, fill, then hit. After the TTL, the cycle starts again.",
  },

  canvas: {
    title: "Draw it from scratch: a product page with a cache",
    brief: "A shopper opens a product page: details and an image. Draw the parts. Details are cached next to the app server, the database stays the source of truth, and the image comes through a CDN. Point each arrow from the part that asks to the part that answers.",
    parts: ["client", "server", "cache", "database", "cdn", "queue", "lb"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.1, y: 0.4 }, { id: "s", part: "server", x: 0.42, y: 0.4 },
        { id: "ca", part: "cache", x: 0.82, y: 0.14 }, { id: "d", part: "database", x: 0.82, y: 0.62 },
        { id: "n", part: "cdn", x: 0.42, y: 0.86 },
      ],
      edges: [["c", "s"], ["s", "ca"], ["s", "d"], ["c", "n"]],
    },
    why: {
      "client>server": "The client asks the app server for the product details.",
      "server>cache": "The app checks the cache first. A hit answers from the copy; a miss loads the source and fills the cache.",
      "server>database": "On a miss the app reads the database, which stays the source of truth. The cache never replaces it.",
      "client>cdn": "The image can come from a CDN that serves cacheable content, on a different path from the product data.",
    },
    done: "Details go through the cache with the database behind it, and the image can take its own path through a CDN. Not every request has to go through every layer.",
  },

  followUps: [
    {
      q: "“What would you cache on a product page, and what would you recheck at checkout?”",
      answer: [
        "Cache the frequently read product description, with a freshness policy.",
        "Decide how stale price and availability may be on the page.",
        "At checkout, validate price and stock against the authoritative rules and current state. Plan the miss and cache-failure paths too.",
      ],
      say: "“I’d cache the description with a freshness policy, and at checkout validate price and stock against the source and current state.”",
      deeper: "Days 7 and 13",
    },
    {
      q: "“The cache is fast. Can we remove the database?”",
      answer: [
        "No: in cache-aside the cache is a temporary copy and the database is the authoritative source.",
        "On a miss, an expiry or a cache failure, the source is needed.",
        "A controlled fallback is needed, because sending everything to the database can overload it.",
      ],
      say: "“The cache is a temporary copy. The database is the source of truth, and misses, expiry and failures need it, with a controlled fallback.”",
    },
    {
      q: "“A popular product’s cache entry expires mid-sale. What happens?”",
      answer: [
        "Many requests can miss at once, and the database comes under pressure. That’s a cache stampede.",
        "Possible strategies: controlled refill, request coalescing, or spreading out expiry times.",
        "Which one fits depends on the workload and system behaviour.",
      ],
      say: "“Many misses at once is a stampede. I’d control the refill or coalesce requests, or spread expiry times, depending on the workload.”",
      deeper: "Day 10",
    },
  ],

  faq: [
    { q: "Does a cache make every request fast?", a: "Not automatically. The real response time depends on the workload, the network and the implementation." },
    { q: "Is 60 seconds the right TTL?", a: "It’s only an example. The right TTL depends on how fast the data changes and how fresh users need it to be. Neither TTL nor invalidation guarantees perfect freshness." },
    { q: "Does every layer cache everything?", a: "No. Caching every thing at every layer isn’t safe or useful. A CDN, for example, serves cacheable content, and the image path needn’t be the product data path." },
  ],

  interview: [
    "Say what you’d cache and why: frequently read, rarely changing data.",
    "Keep the database as the source of truth.",
    "Explain miss, hit and cache-aside.",
    "Say how fresh each field has to be: description, price and stock differ.",
    "Cover expiry, stampede and cache failure.",
  ],

  cheatsheet: {
    title: "Day 6 · Caching and CDNs",
    points: [
      "A cache is a temporary copy; the database is the source of truth",
      "Miss: read the source and fill. Hit: answer from the cache",
      "Stale data: the cache is behind the source",
      "TTL and invalidation help freshness; neither is perfect",
      "Price and stock are validated at checkout, not trusted from a cache",
      "Plan for stampedes and cache failure",
    ],
  },

  linkedin:
    "Day 6/21 of System Design Essentials with Klymb.\n\nThousands open the same product page, and the database shouldn’t redo the same work every time. A cache keeps a temporary copy: a miss loads the source and fills it, a hit answers from it.\n\nThe trade-off is freshness: stale data, TTLs, stampedes, and checking price and stock again at checkout.\n\n#SystemDesign #Klymb",

  nextDay: "Day 7: caching and better queries aren’t enough, and one database is still heavy. Replication and sharding solve different problems.",
};

const hi: DayCopy = {
  tag: "Day 6 · Caching aur CDN",
  hookLines: [
    "Sale chal rahi hai, aur hazaaron log ek hi popular shoe khol rahe hain.",
    "Har request database se wahi description maangti hai.",
    "Kya database ko har baar wahi kaam karna padega?",
  ],
  question: "Kya yeh repeated kaam kam ho sakta hai? Aur agar rakhi hui copy purani ho jaye toh?",

  pre: [
    {
      id: "pre-1",
      scenario: "Hazaaron shoppers ek hi popular product page khol rahe hain. Har request database se wahi description maangti hai.",
      prompt: "Repeated kaam kya kam kar sakta hai?",
      choices: [
        { text: "Frequently padhe jaane wale data ki temporary copy rakho, jabki database source of truth rahe", why: "Haan. Yahi cache hai: tez reuse ke liye temporary copy.", best: true },
        { text: "Database hata do aur sab kuch memory mein rakho", why: "Database authoritative source hai. Copy use replace nahi kar sakti." },
        { text: "Shoppers se wait karne ko kaho", why: "Isse repeated kaam kam nahi hota." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Product description database mein update ho gayi, par cache mein purani copy hai.",
      prompt: "Ise kya kehte hain?",
      choices: [
        { text: "Stale data: ek purani cached value", why: "Sahi. Cache source se peeche hai.", best: true },
        { text: "Cache hit", why: "Hit matlab data cache mein mila. Yahan sawaal yeh hai ki woh up to date hai ya nahi." },
        { text: "Bottleneck", why: "Woh limiting stage hai, out-of-date data nahi." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Product page par cached price dikha. Shopper ab checkout par jaata hai.",
      prompt: "Checkout ko kya karna chahiye?",
      choices: [
        { text: "Price aur stock ko authoritative rules aur current state ke hisaab se validate karna", why: "Sahi. Cached display is baat ka proof nahi ki purchase us price par ho jayegi.", best: true },
        { text: "Cached price par bharosa karna", why: "Woh stale ho sakta hai." },
        { text: "Tez hone ke liye check skip karna", why: "Checkout wahi jagah hai jahan correctness sabse zyada matter karti hai." },
      ],
    },
  ],

  revealTitle: "Product 123, cache ke saath aur bina",
  revealSub: "ek fictional shop, simplified design",
  reveal: [
    { when: "Cache", what: "Cache app server ke paas baithta hai aur frequently chahiye data ki temporary copy rakhta hai. Database rehta hai: woh product record ka source hai." },
    { when: "Cache miss", what: "App cache mein product 123 dhoondhti hai aur kuch nahi milta. Woh database se padhti hai, cache mein copy rakhti hai, aur user ko answer deti hai." },
    { when: "Cache hit", what: "Agli request ko cache mein product 123 mil jaata hai, aur app usi se answer deti hai. Yeh cache-aside hai." },
    { when: "Doosre layers", what: "CDN cacheable content, jaise image, alag-alag locations se serve kar sakta hai. Image ka path product data ka path hona zaroori nahi." },
    { when: "Stale data", what: "Agar description database mein badal jaaye par cache purani copy rakhe, toh users ko purani information dikh sakti hai. Checkout par price aur stock authoritative state se chahiye." },
    { when: "Freshness aur failure", what: "TTL entries ko kuch time baad expire karta hai; invalidation data badalne par unhe hatata hai. Popular entry expire hone se stampede ho sakta hai, aur cache band hone se database overload ho sakta hai." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Cache", what: "Woh jagah jahan frequently chahiye information ki temporary copy tez reuse ke liye rakhi jaati hai, taaki har baar original se na poochna pade.", example: "Product 123 ki description" },
      { term: "Cache hit / miss", what: "Hit: data cache mein hai. Miss: nahi hai, toh app source se padhti hai aur cache fill karti hai.", example: "Pehli request miss, agli hit" },
      { term: "Cache-aside", what: "App cache check karti hai; miss par source se load karke cache fill karti hai.", example: "Check, miss, database read, fill, answer" },
      { term: "Stale data", what: "Ek purani cached value jo ab source se match nahi karti.", example: "Purani product description" },
      { term: "TTL aur invalidation", what: "TTL (time to live): entry ek set time baad expire. Invalidation: data badalne par entry hatana ya invalid mark karna. Dono perfect freshness guarantee nahi karte.", example: "Ek example 60-second TTL" },
      { term: "Cache stampede", what: "Popular entry expire hoti hai aur bahut requests ek saath miss karti hain, jisse database par pressure aata hai.", example: "Sale mein popular product" },
    ],
  },

  concept: {
    cards: [{
      name: "Cache kya deta hai",
      examples: ["Source ke kam repeated reads", "Popular data ke liye tez responses"],
      moves: ["Source of truth ko visible rakho", "Jo bar-bar padha jaaye woh cache karo", "Decide karo kitni staleness theek hai"],
    }, {
      name: "Cache kya leta hai",
      examples: ["Data stale ho sakta hai", "Ek aur component chalana padta hai"],
      moves: ["Freshness manage karni padti hai", "Miss, expiry aur failure ke liye plan karo", "Checkout par price aur stock check karo"],
    }],
    rule: "Cache ek temporary copy hai. Database hi source of truth rehta hai.",
  },

  post: [
    {
      id: "post-1",
      scenario: "App cache mein product 123 dhoondhti hai aur koi entry nahi milti.",
      prompt: "Ise kya kehte hain, aur aage kya hota hai?",
      choices: [
        { text: "Cache miss: app database se padhti hai, cache fill karti hai aur answer deti hai", why: "Haan: yahi cache-aside flow hai.", best: true },
        { text: "Cache hit: app cache se answer deti hai", why: "Hit tab hota hai jab entry mil jaaye." },
        { text: "Failure: app haar maan leti hai", why: "Miss normal hai. Matlab bas source se load karna hai." },
      ],
    },
    {
      id: "post-2",
      prompt: "Hamare example mein 60-second TTL ka kya matlab hai?",
      choices: [
        { text: "Entry 60 seconds baad expire ho jaati hai, isliye baad ki read ko fresh data laana pad sakta hai", why: "Sahi. Yeh ek example setting hai, guarantee nahi, aur har product ke liye sahi nahi.", best: true },
        { text: "Data 60 seconds tak hamesha fresh rehta hai, kuch bhi ho jaye", why: "Agar source jaldi badle toh cache phir bhi stale ho sakta hai." },
        { text: "Database 60 seconds baad delete ho jaata hai", why: "Nahi: sirf cached entry expire hoti hai." },
      ],
    },
    {
      id: "post-3",
      scenario: "Sale ke beech popular product ki entry expire hoti hai aur bahut requests ek saath miss karti hain.",
      prompt: "Ise kya kehte hain?",
      choices: [
        { text: "Cache stampede", why: "Haan: ek saath bahut misses database par pressure daalte hain.", best: true },
        { text: "Cache hit", why: "Hit ulta hai: entry mil jaati hai." },
        { text: "Vertical scaling", why: "Woh ek server par resources badhane ki baat hai." },
      ],
    },
    {
      id: "post-4",
      prompt: "Inmein se kaunsi cheez cached page se trust karne ki jagah checkout par dobara validate honi chahiye?",
      choices: [
        { text: "Price aur stock", why: "Haan: checkout unhe authoritative rules aur current state se validate karta hai.", best: true },
        { text: "Shoe ke colour ka naam", why: "Thodi purani description aam taur par acceptable hoti hai." },
        { text: "Page ka title", why: "Purchase uspar depend nahi karti." },
      ],
    },
    {
      id: "post-5",
      prompt: "“Cache tez hai, toh database hata dein.” Isme galat kya hai?",
      choices: [
        { text: "Cache temporary copy hai; database authoritative source hai aur miss, expiry aur failure par uski zaroorat padti hai", why: "Sahi.", best: true },
        { text: "Kuch nahi: cache database se behtar hota hai", why: "Cache source of truth ko replace nahi kar sakta." },
        { text: "Database cache se tez hota hai", why: "Baat yeh nahi hai: dono ke kaam alag hain." },
      ],
    },
  ],

  build: {
    title: "Product 123 ko cache se follow karo",
    intro: "Steps ko sahi order mein lagao. Ya step tap karo, phir slot tap karo.",
    given: "Shopper product 123 kholta hai",
    rows: [["check", "read", "fill"], ["hit", "expire"]],
    rowLabels: ["Pehli request (miss)", "Uske baad"],
    slots: {
      check: { role: "App pehle cache mein dekhti hai", answer: "check" },
      read: { role: "Wahan kuch nahi, toh source se padho", answer: "read" },
      fill: { role: "Agli request ke liye copy rakho", answer: "fill" },
      hit: { role: "Agli request ko mil jaata hai aur answer ho jaata hai", answer: "hit" },
      expire: { role: "TTL ke baad, agli read fresh data laati hai", answer: "expire" },
    },
    chips: [
      { id: "fill", label: "Cache fill karo", does: "baad ki requests ke liye product ki copy cache mein rakhna" },
      { id: "drop", label: "Database hata do", does: "source of truth kho dena, jise cache replace nahi kar sakta" },
      { id: "check", label: "Cache check karo", does: "source se poochne se pehle entry dhoondhna" },
      { id: "hit", label: "Cache se answer (hit)", does: "temporary copy se data serve karna" },
      { id: "read", label: "Database se padho (miss)", does: "authoritative source se product load karna" },
      { id: "expire", label: "TTL entry expire kare", does: "copy ki life khatam karna, taaki baad ki read fresh data la sake" },
    ],
    done: "Check, miss, source se padho, fill, phir hit. TTL ke baad cycle phir shuru.",
  },

  canvas: {
    title: "Scratch se draw karo: cache wala product page",
    brief: "Shopper product page kholta hai: details aur ek image. Parts draw karo. Details app server ke paas cache mein hain, database source of truth rehta hai, aur image CDN se aati hai. Har arrow us part se do jo poochta hai, us part tak jo jawab deta hai.",
    parts: ["client", "server", "cache", "database", "cdn", "queue", "lb"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.1, y: 0.4 }, { id: "s", part: "server", x: 0.42, y: 0.4 },
        { id: "ca", part: "cache", x: 0.82, y: 0.14 }, { id: "d", part: "database", x: 0.82, y: 0.62 },
        { id: "n", part: "cdn", x: 0.42, y: 0.86 },
      ],
      edges: [["c", "s"], ["s", "ca"], ["s", "d"], ["c", "n"]],
    },
    why: {
      "client>server": "Client app server se product details maangta hai.",
      "server>cache": "App pehle cache check karti hai. Hit copy se answer deta hai; miss source se load karke cache fill karta hai.",
      "server>database": "Miss par app database se padhti hai, jo source of truth rehta hai. Cache use kabhi replace nahi karta.",
      "client>cdn": "Image CDN se aa sakti hai jo cacheable content serve karta hai, product data se alag path par.",
    },
    done: "Details cache ke through jaate hain aur peeche database hai, aur image CDN se apna alag raasta le sakti hai. Har request ko har layer se guzarna zaroori nahi.",
  },

  followUps: [
    {
      q: "“Product page par kya cache karoge, aur checkout par kya recheck karoge?”",
      answer: [
        "Frequently padhi jaane wali product description cache karo, freshness policy ke saath.",
        "Decide karo page par price aur availability kitni stale ho sakti hai.",
        "Checkout par price aur stock authoritative rules aur current state se validate karo. Miss aur cache-failure paths bhi plan karo.",
      ],
      say: "“Main description ko freshness policy ke saath cache karunga, aur checkout par price aur stock ko source aur current state se validate karunga.”",
      deeper: "Days 7 aur 13",
    },
    {
      q: "“Cache tez hai. Kya database hata sakte hain?”",
      answer: [
        "Nahi: cache-aside mein cache temporary copy hai aur database authoritative source.",
        "Miss, expiry ya cache failure par source ki zaroorat padti hai.",
        "Controlled fallback chahiye, kyunki sab kuch database par bhej dene se woh overload ho sakta hai.",
      ],
      say: "“Cache temporary copy hai. Database source of truth hai, aur miss, expiry aur failures mein uski zaroorat hai, controlled fallback ke saath.”",
    },
    {
      q: "“Sale ke beech popular product ki cache entry expire ho gayi. Kya hoga?”",
      answer: [
        "Bahut requests ek saath miss kar sakti hain, aur database par pressure aata hai. Yeh cache stampede hai.",
        "Possible strategies: controlled refill, request coalescing, ya expiry times ko spread karna.",
        "Kaunsi fit hai, woh workload aur system behaviour par depend karta hai.",
      ],
      say: "“Ek saath bahut misses stampede hai. Main refill control karunga ya requests coalesce karunga, ya expiry times spread karunga, workload ke hisaab se.”",
      deeper: "Day 10",
    },
  ],

  faq: [
    { q: "Kya cache har request ko tez bana deta hai?", a: "Apne aap nahi. Asli response time workload, network aur implementation par depend karta hai." },
    { q: "Kya 60 seconds sahi TTL hai?", a: "Yeh sirf ek example hai. Sahi TTL is par depend karta hai ki data kitni jaldi badalta hai aur users ko kitni freshness chahiye. TTL ya invalidation, dono perfect freshness guarantee nahi karte." },
    { q: "Kya har layer sab kuch cache karti hai?", a: "Nahi. Har cheez ko har layer par cache karna safe ya useful nahi. CDN, jaise, cacheable content serve karta hai, aur image ka path product data ka path hona zaroori nahi." },
  ],

  interview: [
    "Batao kya cache karoge aur kyun: frequently padha jaane wala, kam badalne wala data.",
    "Database ko source of truth rakho.",
    "Miss, hit aur cache-aside samjhao.",
    "Batao har field kitna fresh chahiye: description, price aur stock alag hain.",
    "Expiry, stampede aur cache failure cover karo.",
  ],

  cheatsheet: {
    title: "Day 6 · Caching aur CDN",
    points: [
      "Cache temporary copy hai; database source of truth hai",
      "Miss: source se padho aur fill karo. Hit: cache se answer",
      "Stale data: cache source se peeche hai",
      "TTL aur invalidation freshness mein madad karte hain; dono perfect nahi",
      "Price aur stock checkout par validate hote hain, cache se trust nahi",
      "Stampede aur cache failure ke liye plan karo",
    ],
  },

  linkedin:
    "Day 6/21: System Design Essentials with Klymb.\n\nHazaaron log ek hi product page kholte hain, aur database ko har baar wahi kaam nahi karna chahiye. Cache temporary copy rakhta hai: miss source se load karke fill karta hai, hit usi se answer deta hai.\n\nTrade-off freshness ka hai: stale data, TTL, stampede, aur checkout par price aur stock phir se check karna.\n\n#SystemDesign #Klymb",

  nextDay: "Day 7: caching aur behtar queries kaafi nahi, aur ek database phir bhi bhaari hai. Replication aur sharding alag problems solve karte hain.",
};

export const essentialsDaySix: Day = {
  day: 6,
  of: 21,
  app: "A shopping app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-6.mp4", poster: "/videos/system-design/essentials-day-6-poster.jpg", minutes: 6, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-6.mp4", poster: "/videos/system-design/essentials-day-6-poster.jpg" },
  },
};
