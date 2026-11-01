/**
 * Day 1 of "System Design Essentials": what system design is, and the last pair of shoes.
 * Built from the Day 1 video script. The shop is a fictional teaching example,
 * not any company's real architecture; keep it that way.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 1 · Basics",
  hookLines: [
    "One pair of shoes left in the store.",
    "Two people tap Buy at the same moment.",
    "Both get “Order confirmed.”",
  ],
  question: "There is only one pair. How did that happen, and what should the system do?",

  pre: [
    {
      id: "pre-1",
      scenario: "You open a shopping app and tap a product. The details appear on your screen.",
      prompt: "Which part actually keeps the product details, the cart and the stock count?",
      choices: [
        { text: "The database", why: "Right. The database is where the app keeps organised information: products, carts, inventory.", best: true },
        { text: "Your phone (the client)", why: "The client shows the product and sends your action onwards. The saved information lives elsewhere." },
        { text: "The application server", why: "The server receives the request and applies the rules. It reads the information from the database, it doesn’t hold it." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Stock is 1. Your request asks “Is it available?” and hears “Yes”. Before it claims the pair, your friend’s request asks the same and also hears “Yes”.",
      prompt: "What goes wrong if the app confirms both?",
      choices: [
        { text: "Two people are promised one pair of shoes", why: "Exactly. Seeing that stock is available and successfully claiming it are two different things.", best: true },
        { text: "Nothing: both checks said yes, so both are fine", why: "Both checks were true when they ran, but only one pair exists. Checking isn’t claiming." },
        { text: "The app just becomes slow", why: "Speed isn’t the problem here. The result is wrong: one item, two confirmations." },
      ],
    },
    {
      id: "pre-3",
      scenario: "An interviewer says: “Design a ticket-booking system.”",
      prompt: "What’s a good first move?",
      choices: [
        { text: "Ask clarifying questions, like: does a seat need to be held before payment, and for how long?", why: "Yes. Understand what the system must do before drawing anything.", best: true },
        { text: "Start drawing servers and databases straight away", why: "Without knowing the requirements you might design the wrong thing. Clarify first." },
        { text: "Say how many servers it needs", why: "You can’t size anything yet. You don’t know the workload or the peak traffic." },
      ],
    },
  ],

  revealTitle: "The last pair, step by step",
  revealSub: "a fictional shop, a simplified design",
  reveal: [
    { when: "Request A", what: "Asks the database: “Is stock available?” Answer: yes, one pair." },
    { when: "Request B", what: "Before A claims it, asks the same question. Also hears: one pair." },
    { when: "The broken app", what: "Confirms both. Two people, one pair of shoes." },
    { when: "The fix", what: "One conditional operation on the shared stock record: “claim one unit only if stock is still available.”" },
    { when: "With the right guarantees", what: "Atomicity plus the database’s concurrency guarantees: once the update commits, at most one claim on the last unit succeeds." },
    { when: "Still to design", what: "Claiming stock isn’t a paid order. Payment, reservation expiry and failures need their own decisions." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "System design", what: "Planning how the parts of an application work together so it meets its users’ needs.", example: "View product, add to cart, place order" },
      { term: "Client / server / database", what: "The client shows things and sends actions; the server receives requests and applies rules; the database stores organised information.", example: "Phone app → app server → product and stock records" },
      { term: "Concurrency", what: "When the work of several requests overlaps in time.", example: "Two shoppers tapping Buy together" },
      { term: "Race condition", what: "When the result depends on the timing of competing operations and can come out wrong.", example: "Both see stock = 1, both confirmed" },
      { term: "Atomicity", what: "A change is applied completely or not at all.", example: "Check and claim as one conditional operation" },
      { term: "Bottleneck / trade-off", what: "A bottleneck is the stage whose limited capacity slows the whole flow. A trade-off is a choice that brings a benefit and also a cost.", example: "One slow stage making everything queue" },
    ],
  },

  concept: {
    cards: [{
      name: "Functional requirements",
      examples: ["View a product", "Add to cart", "Place an order"],
      moves: ["What the system does", "List them before you design", "Every feature traces back to one"],
    }, {
      name: "Non-functional requirements",
      examples: ["An agreed response-time target", "An agreed availability target", "The last item is never sold twice"],
      moves: ["How well, and within which limits", "Agree the targets, don’t invent numbers", "Fast but wrong is still wrong"],
    }],
    rule: "Understand what the system must do, and how well, before you draw a single box.",
  },

  post: [
    {
      id: "post-1",
      prompt: "In simple words, what is system design?",
      choices: [
        { text: "Planning how an application’s parts work together to meet users’ needs", why: "That’s the definition from today’s lesson.", best: true },
        { text: "Writing the code for one feature", why: "Code matters, but system design is about how all the parts work together." },
        { text: "Choosing the colours and layout of the app", why: "That’s UI design. System design is about the parts behind the screen." },
      ],
    },
    {
      id: "post-2",
      scenario: "A shopper taps a product. The phone sends a request, something applies the rules and fetches the details, and the answer comes back.",
      prompt: "What receives the request and applies the rules?",
      choices: [
        { text: "The application server", why: "Right: it receives the request, checks the rules, and gets or updates information.", best: true },
        { text: "The database", why: "The database stores the information. The server is the one asking it." },
        { text: "The client", why: "The client sends the request and shows the result." },
      ],
    },
    {
      id: "post-3",
      scenario: "Two requests both read stock = 1, then both confirm. The outcome depended on which ran when.",
      prompt: "What is this called?",
      choices: [
        { text: "A race condition", why: "The result depends on the timing of competing operations, and it came out wrong.", best: true },
        { text: "A bottleneck", why: "A bottleneck is a slow stage limiting the flow. Here the problem is a wrong result." },
        { text: "Atomicity", why: "Atomicity is part of the fix: a change applies fully or not at all." },
      ],
    },
    {
      id: "post-4",
      prompt: "Which of these is a non-functional requirement?",
      choices: [
        { text: "The product page meets an agreed response-time target", why: "Yes: it says how well the system works, not what it does.", best: true },
        { text: "A user can add a product to the cart", why: "That’s functional: it says what the system does." },
        { text: "A user can view a product", why: "Also functional." },
      ],
    },
    {
      id: "post-5",
      scenario: "One pair is left and 100 shoppers try to buy it.",
      prompt: "What must always stay true?",
      choices: [
        { text: "At most one stock claim succeeds", why: "Exactly. Others may get “unavailable”, and some may get an error or a timeout.", best: true },
        { text: "Every shopper gets a response saying yes or no", why: "Not guaranteed: some requests can fail or time out. Don’t assume every shopper hears back." },
        { text: "The first shopper to tap always wins", why: "The design doesn’t promise who wins, only that the last unit is never claimed twice." },
      ],
    },
  ],

  build: {
    title: "Wire up the shop",
    intro: "Drag each part to the job it does. You can also tap a part, then tap a slot.",
    given: "A shopper taps Buy",
    rows: [["client"], ["server"], ["database"]],
    slots: {
      client: { role: "Shows the product and sends the tap onwards", answer: "client" },
      server: { role: "Receives the request and applies the rules", answer: "server" },
      database: { role: "Keeps product, cart and stock records", answer: "database" },
    },
    chips: [
      { id: "server", label: "Application server", does: "receiving requests and applying the rules" },
      { id: "database", label: "Database", does: "storing organised information like products and stock" },
      { id: "client", label: "Client (app or browser)", does: "showing the product and sending the shopper’s action" },
      { id: "screen", label: "Order confirmed message", does: "a result the client shows, not a part of the system" },
    ],
    done: "That’s the request path: client → server → database, and the response back the same way.",
  },
  canvas: {
    title: "Draw the shop from scratch",
    brief: "A shopper taps Buy on the last pair of shoes. Draw the parts that make this work, and point an arrow from each part to the one it asks.",
    parts: ["client", "server", "database", "cache", "queue"],
    model: {
      nodes: [{ id: "c", part: "client", x: 0.16, y: 0.5 }, { id: "s", part: "server", x: 0.5, y: 0.5 }, { id: "d", part: "database", x: 0.84, y: 0.5 }],
      edges: [["c", "s"], ["s", "d"]],
    },
    why: {
      "client>server": "The phone never touches the database directly. It sends the request to the app server, which applies the rules.",
      "server>database": "The server asks the database to claim one unit only if stock is still available. That one conditional step is what stops the double sale.",
    },
    done: "Client asks the server, the server asks the database, and the response comes back the same way. Every design in this course starts from these three boxes.",
  },

  followUps: [
    {
      q: "“Design a ticket-booking system.” What do you ask first?",
      answer: [
        "Does a user need to hold a seat before paying? For how long does the hold last?",
        "What must never happen? Two people booking the same seat.",
        "Only then: client, server, database, and how one seat is claimed safely.",
      ],
      say: "“Before I design: does a seat get held before payment, and for how long? Then I’ll make sure one seat can only be claimed once.”",
      deeper: "Day 13",
    },
    {
      q: "“The stock claim succeeded. Is the order done?”",
      answer: [
        "No. Claiming stock and completing a paid order are different steps.",
        "Payment can fail, or the shopper can leave. Then the claimed unit should come back.",
        "That needs its own decisions: how long a reservation lasts, and what happens on failure.",
      ],
      say: "“A claimed unit isn’t a paid order. I’d add a reservation that expires if payment doesn’t complete.”",
      deeper: "Days 8 and 13",
    },
    {
      q: "“We have 10 lakh users. How many servers do we need?”",
      answer: [
        "Total users isn’t enough to decide. 10 lakh users aren’t 10 lakh simultaneous requests.",
        "Measure the actual workload and the peak traffic first.",
        "Then find the bottleneck: the stage whose limited capacity slows the whole flow.",
      ],
      say: "“User count alone doesn’t tell me. I’d measure the real workload and the peak, then find the bottleneck.”",
      deeper: "Day 3",
    },
  ],

  faq: [
    { q: "Do I need to know coding to learn system design?", a: "Basic programming helps, but no prior system design knowledge is needed. Day 1 starts from what the client, server and database each do." },
    { q: "Is atomicity alone enough to stop the double sale?", a: "No. Atomicity means a change applies fully or not at all. The database also has to handle competing requests safely, with the right concurrency guarantees. Together, and once the update commits, the last unit gets at most one successful claim." },
    { q: "Is the shoe shop a real company’s design?", a: "No. It’s a simplified, fictional teaching example. Real systems differ, and we don’t claim any company works this way." },
  ],

  interview: [
    "Start with clarifying questions before drawing anything.",
    "List functional requirements (what it does) and non-functional ones (how well).",
    "Draw the basic path: client → server → database, with the response coming back.",
    "Name what must always stay true, like “the last unit is claimed at most once”.",
    "Mention the bottleneck and the trade-off of your fix.",
  ],

  cheatsheet: {
    title: "Day 1 · What system design is",
    points: [
      "System design: how an app’s parts work together to meet users’ needs",
      "Client shows and sends; server applies rules; database stores",
      "Checking stock ≠ claiming stock",
      "Race condition: timing of competing operations gives a wrong result",
      "Fix: one conditional “claim if available” operation, with the right guarantees",
      "Requirements first: functional (what) and non-functional (how well)",
    ],
  },

  linkedin:
    "Day 1/21 of System Design Essentials with Klymb.\n\nOne pair of shoes left, two shoppers tap Buy, both get “Order confirmed”. That’s a race condition: checking stock and claiming it are two different steps.\n\nWhat I learned: system design is planning how an app’s parts (client, server, database) work together. Make the claim one conditional operation, and start every design by asking what the system must do and how well.\n\n#SystemDesign #Klymb",

  nextDay: "Day 2: follow one request from the screen to the server and the database, and back.",
};

const hi: DayCopy = {
  tag: "Day 1 · Basics",
  hookLines: [
    "Store mein shoes ka ek hi pair bacha hai.",
    "Do log ek saath Buy dabate hain.",
    "Dono ko aata hai: “Order confirmed.”",
  ],
  question: "Pair sirf ek hai. Aisa kaise hua, aur system ko kya karna chahiye?",

  pre: [
    {
      id: "pre-1",
      scenario: "Aap shopping app kholte ho aur ek product tap karte ho. Details screen par aa jaati hain.",
      prompt: "Product details, cart aur stock count asal mein kaun rakhta hai?",
      choices: [
        { text: "Database", why: "Sahi. Database woh jagah hai jahan app organised information rakhti hai: products, cart, inventory.", best: true },
        { text: "Aapka phone (client)", why: "Client product dikhata hai aur aapki action aage bhejta hai. Saved information kahin aur hoti hai." },
        { text: "Application server", why: "Server request leta hai aur rules apply karta hai. Information woh database se laata hai, khud nahi rakhta." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Stock = 1. Aapki request poochti hai “Available hai?”, jawab aata hai “Haan”. Claim karne se pehle aapke friend ki request bhi wahi poochti hai, use bhi “Haan” milta hai.",
      prompt: "Agar app dono ko confirm kar de toh kya galat hota hai?",
      choices: [
        { text: "Ek pair shoes do logon ko promise ho gaya", why: "Bilkul. Stock available dekhna aur use successfully claim karna, dono alag cheezein hain.", best: true },
        { text: "Kuch nahi: dono checks ne haan bola, toh dono theek", why: "Dono checks apne time par sahi the, par pair ek hi hai. Check karna claim karna nahi hai." },
        { text: "App bas slow ho jaati hai", why: "Problem speed ki nahi hai. Result galat hai: ek item, do confirmations." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Interviewer kehta hai: “Design a ticket-booking system.”",
      prompt: "Pehla achha step kya hai?",
      choices: [
        { text: "Clarifying questions poocho, jaise: kya payment se pehle seat hold karni hai, aur kitni der?", why: "Haan. Kuch bhi draw karne se pehle samjho ki system ko kya karna hai.", best: true },
        { text: "Seedha servers aur databases draw karna shuru karo", why: "Requirements jaane bina galat cheez design ho sakti hai. Pehle clarify karo." },
        { text: "Bata do kitne servers chahiye", why: "Abhi kuch size nahi kar sakte. Workload aur peak traffic pata hi nahi." },
      ],
    },
  ],

  revealTitle: "Last pair, step by step",
  revealSub: "ek fictional shop, simplified design",
  reveal: [
    { when: "Request A", what: "Database se poochti hai: “Stock available hai?” Jawab: haan, ek pair." },
    { when: "Request B", what: "A ke claim karne se pehle wahi sawaal poochti hai. Use bhi milta hai: ek pair." },
    { when: "Broken app", what: "Dono ko confirm kar deti hai. Do log, ek pair shoes." },
    { when: "Fix", what: "Shared stock record par ek conditional operation: “ek unit tabhi claim karo jab stock abhi bhi available ho.”" },
    { when: "Sahi guarantees ke saath", what: "Atomicity aur database ki concurrency guarantees: update commit hone par last unit ka maximum ek hi claim successful hoga." },
    { when: "Abhi baaki", what: "Stock claim hona paid order nahi hai. Payment, reservation expiry aur failures ke liye alag decisions chahiye." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "System design", what: "Plan karna ki application ke parts milkar kaise kaam karenge, taaki users ki needs poori ho.", example: "Product dekhna, cart mein add, order place" },
      { term: "Client / server / database", what: "Client dikhata hai aur action bhejta hai; server request leta hai aur rules lagata hai; database organised information store karta hai.", example: "Phone app → app server → product aur stock records" },
      { term: "Concurrency", what: "Jab kai requests ka kaam time mein overlap karta hai.", example: "Do shoppers ek saath Buy dabate hain" },
      { term: "Race condition", what: "Jab result competing operations ki timing par depend kare aur galat aa sakta ho.", example: "Dono ne stock = 1 dekha, dono confirm" },
      { term: "Atomicity", what: "Change poora apply ho ya bilkul na ho.", example: "Check aur claim ek conditional operation mein" },
      { term: "Bottleneck / trade-off", what: "Bottleneck woh stage hai jiski limited capacity poore flow ko slow kare. Trade-off woh choice hai jismein fayda bhi hai aur cost bhi.", example: "Ek slow stage ki wajah se sab line mein" },
    ],
  },

  concept: {
    cards: [{
      name: "Functional requirements",
      examples: ["Product dekhna", "Cart mein add karna", "Order place karna"],
      moves: ["System kya karega", "Design se pehle list karo", "Har feature kisi ek requirement se aata hai"],
    }, {
      name: "Non-functional requirements",
      examples: ["Agreed response-time target", "Agreed availability target", "Last item kabhi do baar na bike"],
      moves: ["Kitna achha, aur kin limits mein", "Targets agree karo, numbers invent mat karo", "Fast par galat, phir bhi galat hai"],
    }],
    rule: "Ek bhi box draw karne se pehle samjho ki system ko kya karna hai, aur kitna achha.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Simple words mein, system design kya hai?",
      choices: [
        { text: "Plan karna ki application ke parts milkar users ki needs kaise poori karenge", why: "Aaj ke lesson ki definition yahi hai.", best: true },
        { text: "Ek feature ka code likhna", why: "Code zaroori hai, par system design saare parts ke saath kaam karne ke baare mein hai." },
        { text: "App ke colours aur layout chunna", why: "Woh UI design hai. System design screen ke peeche ke parts ka hai." },
      ],
    },
    {
      id: "post-2",
      scenario: "Shopper product tap karta hai. Phone request bhejta hai, koi rules lagakar details laata hai, aur jawab wapas aata hai.",
      prompt: "Request kaun receive karta hai aur rules apply karta hai?",
      choices: [
        { text: "Application server", why: "Sahi: woh request leta hai, rules check karta hai, aur information laata ya update karta hai.", best: true },
        { text: "Database", why: "Database information store karta hai. Server use poochta hai." },
        { text: "Client", why: "Client request bhejta hai aur result dikhata hai." },
      ],
    },
    {
      id: "post-3",
      scenario: "Do requests dono stock = 1 padhti hain, phir dono confirm. Result is par depend tha ki kaun kab chala.",
      prompt: "Ise kya kehte hain?",
      choices: [
        { text: "Race condition", why: "Result competing operations ki timing par depend karta hai, aur galat aaya.", best: true },
        { text: "Bottleneck", why: "Bottleneck ek slow stage hai jo flow ko rokti hai. Yahan problem galat result hai." },
        { text: "Atomicity", why: "Atomicity fix ka hissa hai: change poora apply ho ya bilkul nahi." },
      ],
    },
    {
      id: "post-4",
      prompt: "Inmein se non-functional requirement kaunsi hai?",
      choices: [
        { text: "Product page ek agreed response-time target meet kare", why: "Haan: yeh batata hai system kitna achha kaam kare, yeh nahi ki kya kare.", best: true },
        { text: "User product cart mein add kar sake", why: "Yeh functional hai: system kya karega." },
        { text: "User product dekh sake", why: "Yeh bhi functional hai." },
      ],
    },
    {
      id: "post-5",
      scenario: "Ek pair bacha hai aur 100 shoppers use khareedne ki koshish karte hain.",
      prompt: "Kya hamesha true rehna chahiye?",
      choices: [
        { text: "Maximum ek stock claim successful ho", why: "Bilkul. Baaki ko “unavailable” mil sakta hai, aur kuch ko error ya timeout.", best: true },
        { text: "Har shopper ko haan ya na ka response mile", why: "Guarantee nahi: kuch requests fail ya timeout ho sakti hain. Yeh assume mat karo ki sabko jawab milega." },
        { text: "Jo pehle tap kare, wahi hamesha jeete", why: "Design yeh promise nahi karta ki kaun jeetega, sirf yeh ki last unit do baar claim na ho." },
      ],
    },
  ],

  build: {
    title: "Shop ko jodo",
    intro: "Har part ko uske kaam par drag karo. Ya part tap karo, phir slot tap karo.",
    given: "Shopper Buy dabata hai",
    rows: [["client"], ["server"], ["database"]],
    slots: {
      client: { role: "Product dikhata hai aur tap aage bhejta hai", answer: "client" },
      server: { role: "Request leta hai aur rules apply karta hai", answer: "server" },
      database: { role: "Product, cart aur stock records rakhta hai", answer: "database" },
    },
    chips: [
      { id: "server", label: "Application server", does: "requests lena aur rules apply karna" },
      { id: "database", label: "Database", does: "products aur stock jaisi organised information store karna" },
      { id: "client", label: "Client (app ya browser)", does: "product dikhana aur shopper ki action bhejna" },
      { id: "screen", label: "Order confirmed message", does: "client ka dikhaya result, system ka part nahi" },
    ],
    done: "Yeh hai request ka raasta: client → server → database, aur response usi raaste wapas.",
  },
  canvas: {
    title: "Shop ko scratch se draw karo",
    brief: "Shopper last pair of shoes par Buy dabata hai. Jo parts isko chalate hain unhe draw karo, aur har part se us part tak arrow do jisse woh poochta hai.",
    parts: ["client", "server", "database", "cache", "queue"],
    model: {
      nodes: [{ id: "c", part: "client", x: 0.16, y: 0.5 }, { id: "s", part: "server", x: 0.5, y: 0.5 }, { id: "d", part: "database", x: 0.84, y: 0.5 }],
      edges: [["c", "s"], ["s", "d"]],
    },
    why: {
      "client>server": "Phone kabhi seedha database tak nahi jaata. Woh request app server ko bhejta hai, jo rules lagata hai.",
      "server>database": "Server database se kehta hai: ek unit tabhi claim karo jab stock abhi bhi available ho. Yahi ek conditional step double sale rokta hai.",
    },
    done: "Client server se poochta hai, server database se, aur response usi raaste wapas aata hai. Is course ka har design inhi teen boxes se shuru hota hai.",
  },

  followUps: [
    {
      q: "“Design a ticket-booking system.” Pehle kya poochoge?",
      answer: [
        "Kya user ko payment se pehle seat hold karni hai? Hold kitni der rahega?",
        "Kya kabhi nahi hona chahiye? Ek seat do logon ko book ho jaana.",
        "Uske baad hi: client, server, database, aur ek seat safely claim kaise ho.",
      ],
      say: "“Design se pehle: kya payment se pehle seat hold hoti hai, aur kitni der? Phir main ensure karunga ki ek seat sirf ek baar claim ho.”",
      deeper: "Day 13",
    },
    {
      q: "“Stock claim successful ho gaya. Kya order complete hai?”",
      answer: [
        "Nahi. Stock claim karna aur paid order complete hona alag steps hain.",
        "Payment fail ho sakta hai, ya shopper chala ja sakta hai. Tab claimed unit wapas aani chahiye.",
        "Iske liye alag decisions chahiye: reservation kitni der chale, aur failure par kya ho.",
      ],
      say: "“Claimed unit paid order nahi hai. Main ek reservation rakhunga jo payment complete na hone par expire ho jaaye.”",
      deeper: "Days 8 aur 13",
    },
    {
      q: "“Hamare 10 lakh users hain. Kitne servers chahiye?”",
      answer: [
        "Sirf total users se decide nahi kar sakte. 10 lakh users matlab 10 lakh simultaneous requests nahi.",
        "Pehle actual workload aur peak traffic measure karo.",
        "Phir bottleneck dhoondo: woh stage jiski limited capacity poora flow slow karti hai.",
      ],
      say: "“Sirf user count se pata nahi chalta. Main real workload aur peak measure karunga, phir bottleneck dhoondhunga.”",
      deeper: "Day 3",
    },
  ],

  faq: [
    { q: "System design seekhne ke liye coding aani chahiye?", a: "Basic programming help karti hai, par system design ka pehle se knowledge zaroori nahi. Day 1 shuru hota hai is se ki client, server aur database kya karte hain." },
    { q: "Kya sirf atomicity double sale rok degi?", a: "Nahi. Atomicity ka matlab change poora apply ho ya bilkul nahi. Database ko competing requests bhi sahi concurrency guarantees ke saath safely handle karni hoti hain. Dono milkar, aur update commit hone par, last unit ka maximum ek claim successful hota hai." },
    { q: "Kya shoe shop kisi real company ka design hai?", a: "Nahi. Yeh simplified, fictional teaching example hai. Real systems alag hote hain, aur hum claim nahi karte ki koi company aise kaam karti hai." },
  ],

  interview: [
    "Kuch draw karne se pehle clarifying questions poocho.",
    "Functional requirements (kya karega) aur non-functional (kitna achha) list karo.",
    "Basic raasta draw karo: client → server → database, aur response wapas.",
    "Batao kya hamesha true rehna chahiye, jaise “last unit maximum ek baar claim ho”.",
    "Bottleneck aur apne fix ka trade-off mention karo.",
  ],

  cheatsheet: {
    title: "Day 1 · System design kya hai",
    points: [
      "System design: app ke parts milkar users ki needs kaise poori karein",
      "Client dikhata aur bhejta hai; server rules lagata hai; database store karta hai",
      "Stock check karna ≠ stock claim karna",
      "Race condition: competing operations ki timing se galat result",
      "Fix: ek conditional “available ho toh claim karo” operation, sahi guarantees ke saath",
      "Pehle requirements: functional (kya) aur non-functional (kitna achha)",
    ],
  },

  linkedin:
    "Day 1/21: System Design Essentials with Klymb.\n\nShoes ka ek pair bacha, do shoppers ne Buy dabaya, dono ko “Order confirmed” mila. Yeh race condition hai: stock check karna aur claim karna do alag steps hain.\n\nMera takeaway: system design matlab plan karna ki app ke parts (client, server, database) milkar kaise kaam karein. Claim ko ek conditional operation banao, aur har design is sawaal se shuru karo ki system ko kya karna hai aur kitna achha.\n\n#SystemDesign #Klymb",

  nextDay: "Day 2: ek request ko screen se server aur database tak, aur wapas, follow karenge.",
};

export const essentialsDayOne: Day = {
  day: 1,
  of: 21,
  app: "A shopping app",
  minutes: 15,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-1.mp4", poster: "/videos/system-design/essentials-day-1-poster.jpg", minutes: 6, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-1.mp4", poster: "/videos/system-design/essentials-day-1-poster.jpg" },
  },
};
