/**
 * Day 2 of "System Design Essentials": how a shopping app works, from a tap to a saved cart.
 * Built from the Day 2 video script. The shop, its API paths and its prices are
 * fictional teaching examples, not any company's real design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 2 · How an app works",
  hookLines: [
    "A shopper opens product 123.",
    "Taps Add to Cart. Closes the app.",
    "Opens it tomorrow, and the cart is still there.",
  ],
  question: "What parts make that work, and what happens between the tap and the saved cart?",

  pre: [
    {
      id: "pre-1",
      scenario: "The shopper closes the app and reopens it later. The cart must still be there.",
      prompt: "Where should the cart be saved?",
      choices: [
        { text: "In the database, through the server", why: "Yes. Information that must outlive the screen goes to the database.", best: true },
        { text: "Only on the phone’s screen", why: "Screen state goes away when the app closes. The cart needs to be stored beyond the screen." },
        { text: "In the request itself", why: "A request carries data for one moment. It doesn’t store anything." },
      ],
    },
    {
      id: "pre-2",
      scenario: "The product’s name and price have loaded, but the image is still loading.",
      prompt: "Does that mean the app or the database has failed?",
      choices: [
        { text: "Not necessarily: the image comes through a separate request", why: "Right. The product response has the image’s address; the picture is fetched separately, so they can arrive at different times.", best: true },
        { text: "Yes, the database is down", why: "The name and price came from the database just fine. The image is a separate request." },
        { text: "Yes, the whole app has crashed", why: "Part of the page loaded. One page can be several requests." },
      ],
    },
    {
      id: "pre-3",
      scenario: "The cart is saved in the database, but the server’s success response never reaches the phone. The phone shows a timeout.",
      prompt: "What does the shopper actually know?",
      choices: [
        { text: "Nothing for sure: the save may or may not have happened", why: "Exactly. No confirmation means the result is unknown to the shopper.", best: true },
        { text: "The save definitely failed", why: "Not necessarily. In this example the database did save it; only the response was lost." },
        { text: "The save definitely worked", why: "The shopper has no confirmation, so they can’t know that either." },
      ],
    },
  ],

  revealTitle: "Add to Cart, step by step",
  revealSub: "a fictional shop, a simplified design",
  reveal: [
    { when: "Open product 123", what: "The client sends GET /api/products/123. The server finds the record in the database and sends back the name and price, for example as JSON." },
    { when: "The image", what: "The response includes an image URL. The client fetches the picture with a separate request, so it can arrive later." },
    { when: "Tap Add to Cart", what: "The client sends POST /api/cart/items with the product ID and quantity in the request body." },
    { when: "Server checks", what: "Who is this? (authentication) May they change this cart? (authorization) Is the input valid? (validation)" },
    { when: "Save", what: "If the checks pass, the cart is updated in the database. Once the save is confirmed, the server responds and the app shows the updated cart." },
    { when: "Come back later", what: "The client asks for the saved cart, the server checks access and reads it from the database. That’s persistence." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "API", what: "The agreed way the client asks the server for things: what it can request, and what the response looks like.", example: "GET /api/products/123" },
      { term: "GET / POST", what: "Here GET is used to retrieve information, and POST to send new information to save.", example: "Read a product; add an item to the cart" },
      { term: "JSON", what: "A text format with named fields.", example: "product_id, name, price" },
      { term: "Request body", what: "The data the client sends along with a request.", example: "product_id: 123, quantity: 1" },
      { term: "Authentication / authorization / validation", what: "Who is the user? Are they allowed to do this? Is the input correct?", example: "Signed-in user changing their own cart" },
      { term: "Persistence", what: "Information stays stored beyond the temporary screen state.", example: "The cart is still there tomorrow" },
    ],
  },

  concept: {
    cards: [{
      name: "Read",
      examples: ["Open a product page", "Show the saved cart"],
      moves: ["Fetch information without changing it", "Here: a GET request", "Server finds the record, sends it back"],
    }, {
      name: "Write",
      examples: ["Add an item to the cart", "Change the quantity"],
      moves: ["Change saved information", "Here: a POST request with a body", "Server checks first, then saves, then confirms"],
    }],
    rule: "No response is not proof that the write failed. Without a confirmation, the result is unknown.",
  },

  post: [
    {
      id: "post-1",
      prompt: "What is an API?",
      choices: [
        { text: "The agreed interface for what a client can request and what response it gets", why: "That’s it: an agreed way to ask and answer.", best: true },
        { text: "The database where products are stored", why: "That’s the database. The API is how the client talks to the server." },
        { text: "The app’s screen design", why: "The API isn’t visual. It defines requests and responses." },
      ],
    },
    {
      id: "post-2",
      scenario: "The shopper taps Add to Cart.",
      prompt: "In our example, which request does the client send?",
      choices: [
        { text: "POST /api/cart/items, with the product ID and quantity in the body", why: "Right: this changes saved information, so it’s a write request with a body.", best: true },
        { text: "GET /api/products/123", why: "That reads the product. Adding to the cart changes saved data." },
        { text: "No request: the phone just updates the screen", why: "Then nothing would be saved. The server and database must be told." },
      ],
    },
    {
      id: "post-3",
      prompt: "Checking whether the signed-in user is allowed to change this cart is called…",
      choices: [
        { text: "Authorization", why: "Yes: is this user permitted to take this action?", best: true },
        { text: "Authentication", why: "Authentication checks who the user is. Permission is authorization." },
        { text: "Validation", why: "Validation checks whether the input is correct, like a valid product and an allowed quantity." },
      ],
    },
    {
      id: "post-4",
      scenario: "The Add to Cart button is hidden in the app for some users.",
      prompt: "Is hiding the button enough to stop them changing the cart?",
      choices: [
        { text: "No: a request can still reach the server, so the server must check", why: "Right. Hiding a button on the screen doesn’t always stop the request. The server checks permission and input itself.", best: true },
        { text: "Yes, no button means no request", why: "Requests don’t only come from buttons. The server can’t trust the screen." },
        { text: "Yes, if the button is greyed out too", why: "Still a screen-only change. The server must do its own checks." },
      ],
    },
    {
      id: "post-5",
      scenario: "The phone shows a timeout after Add to Cart. The shopper wants to tap again straight away.",
      prompt: "What’s the risk?",
      choices: [
        { text: "Depending on how the API behaves, the item or quantity could be added twice", why: "Yes. The first save may already have happened. Safe retries and idempotency come later in the course.", best: true },
        { text: "No risk: the first attempt definitely failed", why: "A timeout doesn’t prove failure. The save may have worked." },
        { text: "The cart will be deleted", why: "Nothing in the design deletes the cart. The risk is a duplicate." },
      ],
    },
  ],

  build: {
    title: "Add to Cart, in order",
    intro: "Drag each step to its place in the flow. You can also tap a step, then tap a slot.",
    given: "Shopper taps Add to Cart",
    rows: [["send"], ["checks"], ["save"], ["respond"]],
    slots: {
      send: { role: "The client sends the product ID and quantity", answer: "send" },
      checks: { role: "The server checks who it is, if they’re allowed, and the input", answer: "checks" },
      save: { role: "The cart item is written and confirmed", answer: "save" },
      respond: { role: "The server replies and the app shows the updated cart", answer: "respond" },
    },
    chips: [
      { id: "checks", label: "Server checks", does: "authentication, authorization and validation before anything changes" },
      { id: "respond", label: "Response to client", does: "telling the app the save is confirmed so it can show the new cart" },
      { id: "send", label: "POST request", does: "the client sending product ID and quantity in the request body" },
      { id: "save", label: "Database save", does: "writing the cart item so it persists" },
      { id: "show", label: "Show updated cart first", does: "showing it before the save is confirmed would fake a result" },
    ],
    done: "That’s the write path: request → checks → save → response. Confirm the save before showing it.",
  },
  canvas: {
    title: "Draw the product page and cart from scratch",
    brief: "Draw what happens when a shopper opens product 123 (details and its image) and taps Add to Cart. Point each arrow from the part that asks to the part that answers.",
    parts: ["client", "server", "database", "storage", "cache", "queue", "lb"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.16, y: 0.35 }, { id: "s", part: "server", x: 0.5, y: 0.35 },
        { id: "d", part: "database", x: 0.84, y: 0.35 }, { id: "i", part: "storage", x: 0.5, y: 0.8 },
      ],
      edges: [["c", "s"], ["s", "d"], ["c", "i"]],
    },
    why: {
      "client>server": "Every GET and POST goes from the client to the app server through the API.",
      "server>database": "The server reads the product and writes the cart item in the database, after its checks.",
      "client>storage": "The image is a separate request: the client fetches it from where images are served, using the image URL in the product response.",
    },
    done: "One page, two paths: details and cart through the server and database, and the picture straight from the image store. That’s why they can arrive at different times.",
  },

  design: {
    title: "Design a basic shopping cart",
    brief: "An interviewer asks: “Design a basic shopping cart. What happens from the moment the user taps Add to Cart until the cart is saved?” Explain it in your own words.",
    constraints: [
      "Include the client, server, database, request and response",
      "The cart must still be there when the user comes back",
      "Only the signed-in owner can change their cart",
    ],
    minChars: 120,
    walkthrough: [
      { heading: "One possible answer", points: ["The client sends the product ID and quantity to the server.", "The server checks the user’s identity, permission and input.", "The cart item is saved in the database.", "Once the save is confirmed, the server responds and the client shows the updated cart.", "Later, the user can retrieve the saved record."] },
      { heading: "If the response times out", points: ["The client can’t tell from a timeout alone whether the save happened.", "Show the result as pending or unconfirmed.", "Check the latest cart state or the operation status with the server.", "If you retry, design a way to prevent duplicate changes."] },
    ],
    checklist: [
      "I said who sends the request and what’s in it",
      "I listed what the server checks",
      "I said where the data is saved",
      "I confirmed the save before showing the result",
      "I handled the timeout case honestly",
    ],
  },

  followUps: [
    {
      q: "“The response timed out. What now?”",
      answer: [
        "From a timeout alone, the client can’t tell whether the save happened.",
        "The app can show the result as pending or unconfirmed.",
        "Check the latest cart state or the operation’s status with the server.",
        "If a retry is needed, design a way to prevent a duplicate change.",
      ],
      say: "“A timeout means the result is unknown. I’d show it as pending, check the status with the server, and make retries safe from duplicates.”",
      deeper: "Days 8 and 10",
    },
    {
      q: "“Why does the server check permissions if the app already hides the button?”",
      answer: [
        "Hiding a button on the screen doesn’t always stop a request from being sent.",
        "So the server itself checks that the signed-in user may change this cart.",
        "And it checks the input is valid: a real product and an allowed quantity.",
      ],
      say: "“The screen can’t be trusted. The server checks identity, permission and input on every request.”",
    },
    {
      q: "“The product page loaded but the image didn’t. Is the system down?”",
      answer: [
        "Not necessarily. The product response carries an image URL.",
        "The image is fetched with a separate request from where images are served.",
        "One page can be several requests, arriving at different times.",
      ],
      say: "“Details and image are separate requests, so one can be late without the system being down.”",
      deeper: "Day 6",
    },
  ],

  faq: [
    { q: "Is JSON the only response format?", a: "No. The response can be JSON, a text format with named fields, and it’s a common choice. Other formats exist; today’s example uses JSON." },
    { q: "Does saving to a database mean the cart can never be lost?", a: "Not by itself. In our design the cart is in the database, but exact durability and recovery guarantees depend on how the storage is configured." },
    { q: "If I check the cart after a timeout, does that prove my attempt worked?", a: "Not always. The latest cart state alone may not prove the outcome of one specific attempt. Safe retries and idempotency come later in the course." },
  ],

  interview: [
    "Draw three boxes: client, server, database, with requests going in and responses coming back.",
    "Reads (GET a product) vs writes (POST to the cart).",
    "On a write, the server checks: authentication, authorization, validation.",
    "Confirm the save before the client shows it.",
    "Timeouts: result unknown; show pending, check status, make retries safe.",
  ],

  cheatsheet: {
    title: "Day 2 · How an app works",
    points: [
      "API: the agreed way to ask the server and get a response",
      "GET reads a product; POST with a body adds to the cart",
      "One page can be several requests (details, then image)",
      "Server checks: who (authentication), allowed (authorization), valid (validation)",
      "Persistence: the cart outlives the screen because it’s in the database",
      "No response ≠ failed write: the result is unknown",
    ],
  },

  linkedin:
    "Day 2/21 of System Design Essentials with Klymb.\n\nToday I followed one tap through a shopping app: GET a product, POST to the cart, the server checks who you are, whether you’re allowed and whether the input is valid, then the database saves it and the server confirms.\n\nThe lesson that stuck: if the response times out, the save may or may not have happened. No response isn’t proof of failure.\n\n#SystemDesign #Klymb",

  nextDay: "Day 3: more users arrive and the app slows down. Where’s the problem, and how do you find it?",
};

const hi: DayCopy = {
  tag: "Day 2 · App kaise kaam karti hai",
  hookLines: [
    "Shopper product 123 kholta hai.",
    "Add to Cart dabata hai. App band kar deta hai.",
    "Kal kholta hai, aur cart wahin hai.",
  ],
  question: "Iske peeche kaunse parts hain, aur tap se saved cart tak kya hota hai?",

  pre: [
    {
      id: "pre-1",
      scenario: "Shopper app band karke baad mein kholta hai. Cart wahin hona chahiye.",
      prompt: "Cart kahan save hona chahiye?",
      choices: [
        { text: "Database mein, server ke through", why: "Haan. Jo information screen ke baad bhi rehni chahiye, woh database mein jaati hai.", best: true },
        { text: "Sirf phone ki screen par", why: "Screen state app band hote hi chali jaati hai. Cart ko screen se aage store hona chahiye." },
        { text: "Request ke andar hi", why: "Request ek pal ke liye data le jaati hai. Woh kuch store nahi karti." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Product ka name aur price aa gaya, lekin image abhi load ho rahi hai.",
      prompt: "Kya iska matlab app ya database fail ho gaya?",
      choices: [
        { text: "Zaroori nahi: image alag request se aati hai", why: "Sahi. Product response mein image ka address hota hai; picture alag se aati hai, isliye dono alag times par aa sakte hain.", best: true },
        { text: "Haan, database down hai", why: "Name aur price database se aa gaye. Image alag request hai." },
        { text: "Haan, poori app crash ho gayi", why: "Page ka hissa load ho gaya. Ek page ke peeche kai requests ho sakti hain." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Database ne cart save kar diya, lekin server ka success response phone tak nahi pahuncha. Phone par timeout dikha.",
      prompt: "Shopper ko asal mein kya pata hai?",
      choices: [
        { text: "Pakka kuch nahi: save hua bhi ho sakta hai, nahi bhi", why: "Bilkul. Confirmation nahi hai, toh shopper ke liye result unknown hai.", best: true },
        { text: "Save definitely fail hua", why: "Zaroori nahi. Is example mein database ne save kar diya tha; sirf response kho gaya." },
        { text: "Save definitely ho gaya", why: "Shopper ke paas confirmation nahi hai, toh yeh bhi nahi pata." },
      ],
    },
  ],

  revealTitle: "Add to Cart, step by step",
  revealSub: "ek fictional shop, simplified design",
  reveal: [
    { when: "Product 123 kholna", what: "Client GET /api/products/123 bhejta hai. Server database mein record dhoondhta hai aur name, price wapas bhejta hai, jaise JSON mein." },
    { when: "Image", what: "Response mein image URL hota hai. Client picture alag request se laata hai, isliye woh baad mein aa sakti hai." },
    { when: "Add to Cart tap", what: "Client POST /api/cart/items bhejta hai, request body mein product ID aur quantity." },
    { when: "Server checks", what: "Yeh kaun hai? (authentication) Kya yeh cart badal sakta hai? (authorization) Input sahi hai? (validation)" },
    { when: "Save", what: "Checks pass hone par database mein cart update hota hai. Save confirm hone ke baad server response bhejta hai aur app updated cart dikhati hai." },
    { when: "Baad mein wapas", what: "Client saved cart maangta hai, server access check karke database se laata hai. Yahi persistence hai." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "API", what: "Client ka server se cheezein maangne ka agreed tareeka: kya request kar sakta hai, aur response kaisa hoga.", example: "GET /api/products/123" },
      { term: "GET / POST", what: "Yahan GET information laane ke liye, aur POST nayi information save karne ke liye bhejne ke liye.", example: "Product padhna; cart mein item add karna" },
      { term: "JSON", what: "Ek text format jismein named fields hoti hain.", example: "product_id, name, price" },
      { term: "Request body", what: "Woh data jo client request ke saath bhejta hai.", example: "product_id: 123, quantity: 1" },
      { term: "Authentication / authorization / validation", what: "User kaun hai? Kya use permission hai? Input sahi hai?", example: "Signed-in user apna hi cart badal raha hai" },
      { term: "Persistence", what: "Information temporary screen state se aage store rehti hai.", example: "Cart kal bhi wahin hai" },
    ],
  },

  concept: {
    cards: [{
      name: "Read",
      examples: ["Product page kholna", "Saved cart dikhana"],
      moves: ["Information bina badle laana", "Yahan: GET request", "Server record dhoondhkar wapas bhejta hai"],
    }, {
      name: "Write",
      examples: ["Cart mein item add karna", "Quantity badalna"],
      moves: ["Saved information badalna", "Yahan: body ke saath POST request", "Server pehle check, phir save, phir confirm"],
    }],
    rule: "Response na milna write fail hone ka proof nahi hai. Confirmation ke bina result unknown hai.",
  },

  post: [
    {
      id: "post-1",
      prompt: "API kya hai?",
      choices: [
        { text: "Agreed interface: client kya request kar sakta hai aur use kya response milega", why: "Yahi hai: poochne aur jawab dene ka agreed tareeka.", best: true },
        { text: "Woh database jahan products store hote hain", why: "Woh database hai. API woh tareeka hai jisse client server se baat karta hai." },
        { text: "App ki screen design", why: "API visual nahi hai. Woh requests aur responses define karti hai." },
      ],
    },
    {
      id: "post-2",
      scenario: "Shopper Add to Cart dabata hai.",
      prompt: "Hamare example mein client kaunsi request bhejta hai?",
      choices: [
        { text: "POST /api/cart/items, body mein product ID aur quantity", why: "Sahi: yeh saved information badalta hai, isliye body ke saath write request hai.", best: true },
        { text: "GET /api/products/123", why: "Woh product padhta hai. Cart mein add karna saved data badalta hai." },
        { text: "Koi request nahi: phone bas screen update karta hai", why: "Tab kuch save nahi hoga. Server aur database ko batana padega." },
      ],
    },
    {
      id: "post-3",
      prompt: "Yeh check karna ki signed-in user is cart ko badal sakta hai ya nahi, kehlata hai…",
      choices: [
        { text: "Authorization", why: "Haan: kya is user ko yeh action lene ki permission hai?", best: true },
        { text: "Authentication", why: "Authentication check karta hai user kaun hai. Permission authorization hai." },
        { text: "Validation", why: "Validation check karta hai input sahi hai ya nahi, jaise valid product aur allowed quantity." },
      ],
    },
    {
      id: "post-4",
      scenario: "Kuch users ke liye app mein Add to Cart button chhupa diya gaya hai.",
      prompt: "Kya button chhupana unhe cart badalne se rokne ke liye kaafi hai?",
      choices: [
        { text: "Nahi: request phir bhi server tak pahunch sakti hai, isliye server ko check karna hoga", why: "Sahi. Screen par button chhupane se request hamesha nahi rukti. Server khud permission aur input check karta hai.", best: true },
        { text: "Haan, button nahi toh request nahi", why: "Requests sirf buttons se nahi aati. Server screen par trust nahi kar sakta." },
        { text: "Haan, agar button grey bhi kar dein", why: "Phir bhi sirf screen ka change hai. Server ko apne checks karne honge." },
      ],
    },
    {
      id: "post-5",
      scenario: "Add to Cart ke baad phone par timeout dikha. Shopper turant dobara tap karna chahta hai.",
      prompt: "Risk kya hai?",
      choices: [
        { text: "API ke behaviour ke hisaab se item ya quantity do baar add ho sakti hai", why: "Haan. Pehla save shayad ho chuka hai. Safe retries aur idempotency aage course mein.", best: true },
        { text: "Koi risk nahi: pehla attempt definitely fail hua", why: "Timeout failure ka proof nahi hai. Save ho bhi sakta hai." },
        { text: "Cart delete ho jayega", why: "Design mein kuch cart delete nahi karta. Risk duplicate ka hai." },
      ],
    },
  ],

  build: {
    title: "Add to Cart, sahi order mein",
    intro: "Har step ko flow mein uski jagah par drag karo. Ya step tap karo, phir slot tap karo.",
    given: "Shopper Add to Cart dabata hai",
    rows: [["send"], ["checks"], ["save"], ["respond"]],
    slots: {
      send: { role: "Client product ID aur quantity bhejta hai", answer: "send" },
      checks: { role: "Server check karta hai kaun hai, allowed hai, aur input sahi hai", answer: "checks" },
      save: { role: "Cart item likha jaata hai aur confirm hota hai", answer: "save" },
      respond: { role: "Server jawab deta hai aur app updated cart dikhati hai", answer: "respond" },
    },
    chips: [
      { id: "checks", label: "Server checks", does: "kuch badalne se pehle authentication, authorization aur validation" },
      { id: "respond", label: "Client ko response", does: "app ko batana ki save confirm hai, taaki naya cart dikhe" },
      { id: "send", label: "POST request", does: "client request body mein product ID aur quantity bhejta hai" },
      { id: "save", label: "Database save", does: "cart item likhna taaki woh persist kare" },
      { id: "show", label: "Pehle updated cart dikhao", does: "save confirm hone se pehle dikhana result fake karna hoga" },
    ],
    done: "Yeh hai write path: request → checks → save → response. Dikhane se pehle save confirm karo.",
  },
  canvas: {
    title: "Product page aur cart scratch se draw karo",
    brief: "Draw karo jab shopper product 123 kholta hai (details aur image) aur Add to Cart dabata hai. Har arrow us part se do jo poochta hai, us part tak jo jawab deta hai.",
    parts: ["client", "server", "database", "storage", "cache", "queue", "lb"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.16, y: 0.35 }, { id: "s", part: "server", x: 0.5, y: 0.35 },
        { id: "d", part: "database", x: 0.84, y: 0.35 }, { id: "i", part: "storage", x: 0.5, y: 0.8 },
      ],
      edges: [["c", "s"], ["s", "d"], ["c", "i"]],
    },
    why: {
      "client>server": "Har GET aur POST client se API ke through app server tak jaata hai.",
      "server>database": "Server checks ke baad database mein product padhta hai aur cart item likhta hai.",
      "client>storage": "Image alag request hai: client product response ke image URL se use image-serving jagah se laata hai.",
    },
    done: "Ek page, do raaste: details aur cart server aur database se, aur picture seedha image store se. Isliye dono alag times par aa sakte hain.",
  },

  design: {
    title: "Ek basic shopping cart design karo",
    brief: "Interviewer poochta hai: “Design a basic shopping cart. User ke Add to Cart dabane se lekar cart save hone tak kya hota hai?” Apne words mein explain karo.",
    constraints: [
      "Client, server, database, request aur response include karo",
      "User wapas aaye toh cart wahin hona chahiye",
      "Sirf signed-in owner apna cart badal sake",
    ],
    minChars: 120,
    walkthrough: [
      { heading: "Ek possible answer", points: ["Client product ID aur quantity server ko bhejta hai.", "Server user ki identity, permission aur input check karta hai.", "Cart item database mein save hota hai.", "Save confirm hone ke baad server response bhejta hai aur client updated cart dikhata hai.", "Baad mein user saved record retrieve kar sakta hai."] },
      { heading: "Agar response timeout ho jaaye", points: ["Sirf timeout dekhkar client nahi bata sakta ki save hua ya nahi.", "Result pending ya unconfirmed dikhao.", "Server se latest cart state ya operation status check karo.", "Retry karni pade toh duplicate change rokne ka tareeka design karo."] },
    ],
    checklist: [
      "Maine bataya request kaun bhejta hai aur usmein kya hai",
      "Maine list kiya server kya check karta hai",
      "Maine bataya data kahan save hota hai",
      "Result dikhane se pehle maine save confirm kiya",
      "Maine timeout case imaandaari se handle kiya",
    ],
  },

  followUps: [
    {
      q: "“Response timeout ho gaya. Ab kya?”",
      answer: [
        "Sirf timeout se client nahi bata sakta ki save hua ya nahi.",
        "App result ko pending ya unconfirmed dikha sakti hai.",
        "Server se latest cart state ya operation ka status check karo.",
        "Retry karni pade toh duplicate change rokne ka tareeka design karo.",
      ],
      say: "“Timeout matlab result unknown. Main use pending dikhaunga, server se status check karunga, aur retries ko duplicates se safe banaunga.”",
      deeper: "Days 8 aur 10",
    },
    {
      q: "“App button chhupa deti hai, phir bhi server permission kyun check kare?”",
      answer: [
        "Screen par button chhupane se request bhejna hamesha nahi rukta.",
        "Isliye server khud check karta hai ki signed-in user yeh cart badal sakta hai.",
        "Aur input valid hai: asli product aur allowed quantity.",
      ],
      say: "“Screen par trust nahi kar sakte. Server har request par identity, permission aur input check karta hai.”",
    },
    {
      q: "“Product page load ho gaya par image nahi. Kya system down hai?”",
      answer: [
        "Zaroori nahi. Product response mein image URL hota hai.",
        "Image alag request se image-serving location se aati hai.",
        "Ek page kai requests ho sakta hai, jo alag times par aati hain.",
      ],
      say: "“Details aur image alag requests hain, isliye ek late ho sakti hai bina system down hue.”",
      deeper: "Day 6",
    },
  ],

  faq: [
    { q: "Kya JSON hi ek response format hai?", a: "Nahi. Response JSON mein ho sakta hai, named fields wala text format, aur yeh common choice hai. Doosre formats bhi hain; aaj ka example JSON use karta hai." },
    { q: "Database mein save matlab cart kabhi nahi khoyega?", a: "Sirf isse nahi. Hamare design mein cart database mein hai, par exact durability aur recovery guarantees storage configuration par depend karti hain." },
    { q: "Timeout ke baad cart check karun toh kya proof mil jayega ki mera attempt chala?", a: "Hamesha nahi. Sirf latest cart state kisi ek specific attempt ka outcome prove nahi karti. Safe retries aur idempotency aage course mein." },
  ],

  interview: [
    "Teen boxes draw karo: client, server, database; requests andar, responses wapas.",
    "Reads (product GET) vs writes (cart par POST).",
    "Write par server check karta hai: authentication, authorization, validation.",
    "Client ke dikhane se pehle save confirm karo.",
    "Timeout: result unknown; pending dikhao, status check karo, retries safe banao.",
  ],

  cheatsheet: {
    title: "Day 2 · App kaise kaam karti hai",
    points: [
      "API: server se poochne aur response paane ka agreed tareeka",
      "GET product padhta hai; body ke saath POST cart mein add karta hai",
      "Ek page kai requests ho sakta hai (details, phir image)",
      "Server checks: kaun (authentication), allowed (authorization), valid (validation)",
      "Persistence: cart database mein hai, isliye screen ke baad bhi rehta hai",
      "Response nahi ≠ write fail: result unknown hai",
    ],
  },

  linkedin:
    "Day 2/21: System Design Essentials with Klymb.\n\nAaj maine shopping app mein ek tap ko follow kiya: product GET, cart par POST, server check karta hai aap kaun ho, allowed ho ya nahi, input valid hai ya nahi, phir database save karta hai aur server confirm karta hai.\n\nJo baat yaad reh gayi: response timeout ho jaaye toh save hua bhi ho sakta hai, nahi bhi. Response na milna failure ka proof nahi hai.\n\n#SystemDesign #Klymb",

  nextDay: "Day 3: users badhenge aur app slow hogi. Problem kahan hai, aur kaise dhoondhein?",
};

export const essentialsDayTwo: Day = {
  day: 2,
  of: 21,
  app: "A shopping app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-2.mp4", poster: "/videos/system-design/essentials-day-2-poster.jpg", minutes: 7, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-2.mp4", poster: "/videos/system-design/essentials-day-2-poster.jpg" },
  },
};
