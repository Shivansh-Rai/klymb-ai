/**
 * Day 4 of "System Design Essentials": which server gets the next request.
 * Built from the Day 4 video script. The shop and its servers are fictional
 * teaching examples, not any company's real design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 4 · Load balancing",
  hookLines: [
    "The shop now has three servers: A, B and C.",
    "You log in on A. Your next request lands on B.",
    "Does B know you’re logged in?",
  ],
  question: "If your login lives only in A’s memory, what happens on B?",

  pre: [
    {
      id: "pre-1",
      scenario: "Your login request reached server A. Your next request goes to server B. Login information is kept only in A’s memory.",
      prompt: "What may happen on B?",
      choices: [
        { text: "B doesn’t know you’re logged in, so you may hit a login or session problem", why: "Right. Information kept in one server’s own memory isn’t visible to the others.", best: true },
        { text: "B automatically sees A’s memory", why: "Servers don’t share local memory by default." },
        { text: "Nothing: sessions always follow you", why: "Only if the design makes that true, for example with a shared session store." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Server B fails halfway through an add-to-cart write. The client never gets a response.",
      prompt: "What does the client know?",
      choices: [
        { text: "The result is unknown: the write may or may not have happened", why: "Yes. A lost response isn’t proof the write failed, so repeating it blindly isn’t safe.", best: true },
        { text: "The write definitely failed", why: "Not necessarily. B may have saved it before failing." },
        { text: "The write definitely worked", why: "There’s no confirmation, so that can’t be known either." },
      ],
    },
    {
      id: "pre-3",
      scenario: "A load balancer now sits in front of the three servers.",
      prompt: "Is the system now safe from failures?",
      choices: [
        { text: "No: the load balancer, the session store and the database are dependencies that can fail too", why: "Right. A load balancer helps, but it doesn’t remove every point of failure.", best: true },
        { text: "Yes: a load balancer makes it failure-proof", why: "It can’t make the whole system failure-proof. It’s a component with its own failure behaviour." },
        { text: "Yes, as long as there are three servers", why: "Three servers still depend on shared parts." },
      ],
    },
  ],

  revealTitle: "From one server to three",
  revealSub: "a fictional shop, a simplified design",
  reveal: [
    { when: "Three servers", what: "More instances add capacity, but now someone has to decide where each request goes." },
    { when: "Load balancer", what: "Sits between the client and the servers and routes each incoming request to a configured, available instance. The response comes back to the client the same way." },
    { when: "Routing rules", what: "Round robin hands requests to A, B, C in turn. Least connections looks at active connections. Equal numbers of requests don’t always mean equal work." },
    { when: "Health checks", what: "The balancer probes the servers. If B fails the configured checks, new requests go to healthy ones. Detection takes time and policies vary." },
    { when: "Requests in flight", what: "A request already running on B may fail. If it was a write, the client may not know the result, so it isn’t safe to repeat blindly." },
    { when: "Shared session store", what: "Keep who’s logged in in a store every server can read, not in one server’s memory. Then any suitable server can handle the next request." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Load balancer", what: "Routes incoming requests to configured, available server instances.", example: "Client → load balancer → server A, B or C" },
      { term: "Round robin / least connections", what: "Two routing rules. Round robin goes in turn. Least connections picks by active connections, not exact computing load.", example: "A, B, C, A, B, C…" },
      { term: "Health check", what: "A periodic probe. After the configured checks fail, a server is marked unhealthy and new traffic avoids it. Detection isn’t instant or perfect.", example: "B fails its checks" },
      { term: "Session", what: "Information that helps identify a signed-in user across requests.", example: "You’re logged in on the next request too" },
      { term: "Stateless application server", what: "A server that doesn’t need session data kept in its own local memory to handle a request. The app still has data: it lives in the database and shared stores.", example: "Cart in the database, session in a shared store" },
      { term: "Sticky sessions", what: "Trying to keep one user on the same server. Useful sometimes, but if that server fails, the session and recovery need care.", example: "User always routed to A" },
    ],
  },

  concept: {
    cards: [{
      name: "Shared session store",
      examples: ["Any server can check who’s logged in", "Separate from the products and cart database"],
      moves: ["Session lives outside any one server", "Servers can be added or replaced more easily", "The store itself must stay available"],
    }, {
      name: "Sticky sessions",
      examples: ["One user, one server where possible", "Session kept in that server’s memory"],
      moves: ["Can work for some cases", "If that server fails, the session may be lost", "Needs careful recovery handling"],
    }],
    rule: "Important session information shouldn’t depend on one server’s temporary memory.",
  },

  post: [
    {
      id: "post-1",
      prompt: "What does a load balancer do?",
      choices: [
        { text: "Routes incoming requests to configured, available server instances", why: "Yes: that’s its job.", best: true },
        { text: "Stores the products and the cart", why: "That’s the database." },
        { text: "Makes every request take the same time", why: "It doesn’t control how long each request takes." },
      ],
    },
    {
      id: "post-2",
      scenario: "Three healthy servers, and requests are handed to A, then B, then C, then A again.",
      prompt: "Which routing rule is this?",
      choices: [
        { text: "Round robin", why: "Yes: in turn, in a simplified healthy-server example.", best: true },
        { text: "Least connections", why: "That picks by active connections, not by turn." },
        { text: "Sticky sessions", why: "That keeps one user on one server." },
      ],
    },
    {
      id: "post-3",
      scenario: "Server B fails the load balancer’s configured health checks.",
      prompt: "What can happen next?",
      choices: [
        { text: "New requests can be sent to the other healthy servers", why: "Yes, in this policy. Detection takes time, though, and behaviour depends on the configuration.", best: true },
        { text: "Every request that was running on B is saved automatically", why: "No. Requests already running on B can fail." },
        { text: "The load balancer stops being needed", why: "It’s still routing the traffic." },
      ],
    },
    {
      id: "post-4",
      prompt: "What does “stateless application server” mean here?",
      choices: [
        { text: "A request doesn’t depend on session data held in one specific server’s local memory", why: "Right. Data still exists, in the database and shared stores.", best: true },
        { text: "The app stores no data at all", why: "No: carts, users and orders are in the database." },
        { text: "The server never fails", why: "That has nothing to do with being stateless." },
      ],
    },
    {
      id: "post-5",
      prompt: "Where should important session information live so any server can check it?",
      choices: [
        { text: "In a shared session store", why: "Yes: every server can verify the session there.", best: true },
        { text: "In server A’s memory only", why: "Then B and C can’t see it." },
        { text: "On the load balancer’s screen", why: "That isn’t a thing. A shared store is the design." },
      ],
    },
  ],

  build: {
    title: "Wire up three servers",
    intro: "Drag each part to the job it does. You can also tap a part, then tap a slot.",
    given: "Three app servers: A, B and C",
    rows: [["lb", "servers"], ["session", "database"]],
    slots: {
      lb: { role: "Receives requests and routes them to a healthy server", answer: "lb" },
      servers: { role: "Handle the request without keeping login in their own memory", answer: "servers" },
      session: { role: "Keeps who’s logged in, readable by every server", answer: "session" },
      database: { role: "Keeps products, carts and orders", answer: "database" },
    },
    chips: [
      { id: "session", label: "Shared session store", does: "keeping session information where every server can check it" },
      { id: "local", label: "Login kept in server A’s memory", does: "information the other servers can’t see, which causes the problem" },
      { id: "lb", label: "Load balancer", does: "routing incoming requests to available server instances" },
      { id: "database", label: "Database", does: "storing products, carts and orders" },
      { id: "servers", label: "Stateless app servers", does: "handling requests without relying on local session memory" },
    ],
    done: "Client → load balancer → servers, with the session store and database shared by all of them.",
  },

  canvas: {
    title: "Draw it from scratch: three servers",
    brief: "Draw the system after we add a load balancer. A client sends a request, three servers can handle it, login is shared, and the data is in one database. Point each arrow from the part that asks to the part that answers.",
    parts: ["client", "lb", "server", "session", "database", "cache", "queue"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.1, y: 0.5 }, { id: "l", part: "lb", x: 0.33, y: 0.5 },
        { id: "s1", part: "server", x: 0.6, y: 0.22 }, { id: "s2", part: "server", x: 0.6, y: 0.78 },
        { id: "ss", part: "session", x: 0.9, y: 0.22 }, { id: "d", part: "database", x: 0.9, y: 0.78 },
      ],
      edges: [["c", "l"], ["l", "s1"], ["l", "s2"], ["s1", "ss"], ["s2", "ss"], ["s1", "d"], ["s2", "d"]],
    },
    why: {
      "client>lb": "The client sends its request to the load balancer, which decides which server gets it.",
      "lb>server": "The load balancer routes each request to a healthy server instance.",
      "server>session": "Every server checks who is logged in from a shared session store, not from its own memory.",
      "server>database": "Products, carts and orders are in the database, shared by all the servers.",
    },
    done: "Any server can handle any request, because login and data live outside them. The load balancer, session store and database are still dependencies that can fail.",
  },

  followUps: [
    {
      q: "“What does a load balancer do? What if a server goes down?”",
      answer: [
        "It routes incoming traffic to the application servers.",
        "Configured health checks can detect an unhealthy server, and new requests can go to healthy ones.",
        "Detection takes time, and a request running on the failed server may have an uncertain result.",
      ],
      say: "“It routes traffic to the servers. Health checks can mark one unhealthy and new requests go to healthy ones, but detection takes time and an in-flight request may be uncertain.”",
      deeper: "Days 10 and 13",
    },
    {
      q: "“How do stateless servers help with scaling?”",
      answer: [
        "A request doesn’t depend on one server’s local session memory.",
        "So traffic can go to any suitable healthy instance, and instances are easier to add or replace.",
        "Shared data and its availability still need handling.",
      ],
      say: "“Stateless servers can be added or replaced easily because no request is tied to one server’s memory. Shared data still has to be kept available.”",
      deeper: "Day 7",
    },
    {
      q: "“Sticky sessions or a shared session store?”",
      answer: [
        "Sticky sessions try to keep one user on one server. They can work, but if that server fails the session may be lost.",
        "A shared session store lets any server verify the session.",
        "Either way, security has to be implemented correctly, and the store becomes a dependency.",
      ],
      say: "“I’d prefer a shared session store, because no single server holds the session. I’d still design for the store’s own failure.”",
    },
  ],

  faq: [
    { q: "Does a load balancer split the work equally?", a: "Not necessarily. Round robin shares requests in turn, but a small request and a big one are still different amounts of work. Least connections counts active connections, which isn’t exact compute load either." },
    { q: "Do health checks catch every failure instantly?", a: "No. They detect failures according to how they’re configured, so there can be a delay, and policies vary." },
    { q: "Is a token the same as a session store?", a: "They’re different approaches. A validated token is another way to identify a signed-in user. Both need security done correctly." },
  ],

  interview: [
    "Draw client, load balancer and three servers, with the response path back.",
    "Mark one server unhealthy and show where new requests go.",
    "Say that an in-flight write may have an unknown result.",
    "Put session data in a shared store, not in one server’s memory.",
    "Name what’s still a dependency: the load balancer, session store, database.",
  ],

  cheatsheet: {
    title: "Day 4 · Load balancing",
    points: [
      "A load balancer routes requests to available servers",
      "Round robin: in turn. Least connections: by active connections",
      "Health checks mark a server unhealthy; detection isn’t instant",
      "An in-flight write on a failed server has an unknown result",
      "Keep sessions in a shared store, not one server’s memory",
      "The balancer and shared stores are dependencies too",
    ],
  },

  linkedin:
    "Day 4/21 of System Design Essentials with Klymb.\n\nThree servers raise a new question: which one gets the next request? A load balancer routes it, health checks steer traffic away from an unhealthy server, and keeping the session in a shared store means any server can handle you.\n\nStill remember: the load balancer, the session store and the database are dependencies that can fail too.\n\n#SystemDesign #Klymb",

  nextDay: "Day 5: inside the database. How products, carts and orders are organised, and why finding them fast matters.",
};

const hi: DayCopy = {
  tag: "Day 4 · Load balancing",
  hookLines: [
    "Shop ke paas ab teen servers hain: A, B aur C.",
    "Aap A par login karte ho. Agli request B par jaati hai.",
    "Kya B ko pata hai ki aap login ho?",
  ],
  question: "Agar login sirf A ki memory mein hai, toh B par kya hoga?",

  pre: [
    {
      id: "pre-1",
      scenario: "Aapki login request server A tak pahunchi. Agli request server B par gayi. Login information sirf A ki memory mein hai.",
      prompt: "B par kya ho sakta hai?",
      choices: [
        { text: "B ko pata nahi ki aap login ho, isliye login ya session ka issue aa sakta hai", why: "Sahi. Ek server ki apni memory mein rakhi information doosre servers ko nahi dikhti.", best: true },
        { text: "B ko A ki memory apne aap dikh jaati hai", why: "Servers default mein local memory share nahi karte." },
        { text: "Kuch nahi: session hamesha saath chalta hai", why: "Tabhi jab design aisa kare, jaise shared session store." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Add-to-cart write ke beech server B fail ho jaata hai. Client ko response nahi milta.",
      prompt: "Client ko kya pata hai?",
      choices: [
        { text: "Result unknown hai: write hua bhi ho sakta hai, nahi bhi", why: "Haan. Response kho jaana write fail hone ka proof nahi hai, isliye use bina soche repeat karna safe nahi.", best: true },
        { text: "Write definitely fail hua", why: "Zaroori nahi. B fail hone se pehle save kar chuka ho sakta hai." },
        { text: "Write definitely ho gaya", why: "Confirmation nahi hai, toh yeh bhi nahi pata." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Teen servers ke aage ab ek load balancer hai.",
      prompt: "Kya ab system failures se safe hai?",
      choices: [
        { text: "Nahi: load balancer, session store aur database bhi dependencies hain jo fail ho sakti hain", why: "Sahi. Load balancer madad karta hai, par har point of failure nahi hatata.", best: true },
        { text: "Haan: load balancer se system failure-proof ho jaata hai", why: "Woh poore system ko failure-proof nahi bana sakta. Uska apna failure behaviour hai." },
        { text: "Haan, jab tak teen servers hain", why: "Teen servers bhi shared parts par depend karte hain." },
      ],
    },
  ],

  revealTitle: "Ek server se teen tak",
  revealSub: "ek fictional shop, simplified design",
  reveal: [
    { when: "Teen servers", what: "Zyada instances capacity badhate hain, par ab kisi ko decide karna hai ki har request kahan jaaye." },
    { when: "Load balancer", what: "Client aur servers ke beech baithta hai aur har incoming request ko configured, available instance tak route karta hai. Response usi raaste client tak wapas aata hai." },
    { when: "Routing rules", what: "Round robin requests A, B, C ko baari-baari deta hai. Least connections active connections dekhta hai. Barabar requests ka matlab hamesha barabar kaam nahi." },
    { when: "Health checks", what: "Balancer servers ko probe karta hai. Agar B configured checks fail kare, nayi requests healthy servers ko jaati hain. Detection mein time lagta hai aur policies alag hoti hain." },
    { when: "Chalti requests", what: "B par pehle se chal rahi request fail ho sakti hai. Agar woh write thi, toh client ko result nahi pata, isliye use bina soche repeat karna safe nahi." },
    { when: "Shared session store", what: "Kaun login hai, yeh aisi store mein rakho jo har server padh sake, ek server ki memory mein nahi. Phir koi bhi suitable server agli request handle kar sakta hai." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Load balancer", what: "Incoming requests ko configured, available server instances tak route karta hai.", example: "Client → load balancer → server A, B ya C" },
      { term: "Round robin / least connections", what: "Do routing rules. Round robin baari-baari. Least connections active connections se chunta hai, exact computing load se nahi.", example: "A, B, C, A, B, C…" },
      { term: "Health check", what: "Ek periodic probe. Configured checks fail hone par server unhealthy mark hota hai aur nayi traffic usse bachti hai. Detection turant ya perfect nahi.", example: "B apne checks fail kare" },
      { term: "Session", what: "Woh information jo signed-in user ko requests ke beech pehchanne mein madad karti hai.", example: "Agli request par bhi aap login ho" },
      { term: "Stateless application server", what: "Aisa server jise request handle karne ke liye apni local memory mein session data nahi chahiye. App mein data phir bhi hai: database aur shared stores mein.", example: "Cart database mein, session shared store mein" },
      { term: "Sticky sessions", what: "Ek user ko same server par rakhne ki koshish. Kabhi useful, par us server ke fail hone par session aur recovery ko dhyan se handle karna padta hai.", example: "User hamesha A par" },
    ],
  },

  concept: {
    cards: [{
      name: "Shared session store",
      examples: ["Koi bhi server check kar sakta hai kaun login hai", "Products aur cart database se alag"],
      moves: ["Session kisi ek server ke bahar rehta hai", "Servers add ya replace karna aasan", "Store khud available rehna chahiye"],
    }, {
      name: "Sticky sessions",
      examples: ["Ek user, jahan ho sake ek server", "Session us server ki memory mein"],
      moves: ["Kuch cases mein kaam kar sakta hai", "Server fail hua toh session jaa sakta hai", "Recovery dhyan se handle karni padti hai"],
    }],
    rule: "Zaroori session information kisi ek server ki temporary memory par depend nahi honi chahiye.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Load balancer kya karta hai?",
      choices: [
        { text: "Incoming requests ko configured, available server instances tak route karta hai", why: "Haan: yahi uska kaam hai.", best: true },
        { text: "Products aur cart store karta hai", why: "Woh database hai." },
        { text: "Har request ko barabar time lagwata hai", why: "Har request kitna time legi, woh woh control nahi karta." },
      ],
    },
    {
      id: "post-2",
      scenario: "Teen healthy servers hain, aur requests A, phir B, phir C, phir wapas A ko di jaati hain.",
      prompt: "Yeh kaunsa routing rule hai?",
      choices: [
        { text: "Round robin", why: "Haan: baari-baari, ek simplified healthy-server example mein.", best: true },
        { text: "Least connections", why: "Woh active connections se chunta hai, baari se nahi." },
        { text: "Sticky sessions", why: "Woh ek user ko ek server par rakhta hai." },
      ],
    },
    {
      id: "post-3",
      scenario: "Server B load balancer ke configured health checks fail kar deta hai.",
      prompt: "Aage kya ho sakta hai?",
      choices: [
        { text: "Nayi requests baaki healthy servers ko bheji ja sakti hain", why: "Haan, is policy mein. Detection mein time lagta hai, aur behaviour configuration par depend karta hai.", best: true },
        { text: "B par chal rahi har request apne aap save ho jaati hai", why: "Nahi. B par pehle se chal rahi requests fail ho sakti hain." },
        { text: "Load balancer ki zaroorat khatam", why: "Woh abhi bhi traffic route kar raha hai." },
      ],
    },
    {
      id: "post-4",
      prompt: "Yahan “stateless application server” ka matlab kya hai?",
      choices: [
        { text: "Request kisi ek specific server ki local memory mein rakhe session data par depend nahi karti", why: "Sahi. Data phir bhi hai, database aur shared stores mein.", best: true },
        { text: "App kuch bhi data store nahi karti", why: "Nahi: carts, users aur orders database mein hain." },
        { text: "Server kabhi fail nahi hota", why: "Stateless hone se iska koi lena-dena nahi." },
      ],
    },
    {
      id: "post-5",
      prompt: "Zaroori session information kahan rakhni chahiye taaki koi bhi server check kar sake?",
      choices: [
        { text: "Shared session store mein", why: "Haan: har server wahan session verify kar sakta hai.", best: true },
        { text: "Sirf server A ki memory mein", why: "Tab B aur C use dekh nahi sakte." },
        { text: "Load balancer ki screen par", why: "Aisi koi cheez nahi hoti. Shared store hi design hai." },
      ],
    },
  ],

  build: {
    title: "Teen servers ko jodo",
    intro: "Har part ko uske kaam par drag karo. Ya part tap karo, phir slot tap karo.",
    given: "Teen app servers: A, B aur C",
    rows: [["lb", "servers"], ["session", "database"]],
    slots: {
      lb: { role: "Requests leta hai aur unhe healthy server tak route karta hai", answer: "lb" },
      servers: { role: "Login apni memory mein rakhe bina request handle karte hain", answer: "servers" },
      session: { role: "Kaun login hai, har server padh sake", answer: "session" },
      database: { role: "Products, carts aur orders rakhta hai", answer: "database" },
    },
    chips: [
      { id: "session", label: "Shared session store", does: "session information wahan rakhna jahan har server check kar sake" },
      { id: "local", label: "Login server A ki memory mein", does: "aisi information jo doosre servers nahi dekh sakte, yahi problem hai" },
      { id: "lb", label: "Load balancer", does: "incoming requests ko available server instances tak route karna" },
      { id: "database", label: "Database", does: "products, carts aur orders store karna" },
      { id: "servers", label: "Stateless app servers", does: "local session memory par depend kiye bina requests handle karna" },
    ],
    done: "Client → load balancer → servers, aur session store aur database sab servers ke liye shared.",
  },

  canvas: {
    title: "Scratch se draw karo: teen servers",
    brief: "Load balancer add hone ke baad ka system draw karo. Client request bhejta hai, teen servers use handle kar sakte hain, login shared hai, aur data ek database mein hai. Har arrow us part se do jo poochta hai, us part tak jo jawab deta hai.",
    parts: ["client", "lb", "server", "session", "database", "cache", "queue"],
    model: {
      nodes: [
        { id: "c", part: "client", x: 0.1, y: 0.5 }, { id: "l", part: "lb", x: 0.33, y: 0.5 },
        { id: "s1", part: "server", x: 0.6, y: 0.22 }, { id: "s2", part: "server", x: 0.6, y: 0.78 },
        { id: "ss", part: "session", x: 0.9, y: 0.22 }, { id: "d", part: "database", x: 0.9, y: 0.78 },
      ],
      edges: [["c", "l"], ["l", "s1"], ["l", "s2"], ["s1", "ss"], ["s2", "ss"], ["s1", "d"], ["s2", "d"]],
    },
    why: {
      "client>lb": "Client apni request load balancer ko bhejta hai, jo decide karta hai kaunsa server use lega.",
      "lb>server": "Load balancer har request ko healthy server instance tak route karta hai.",
      "server>session": "Har server kaun login hai yeh shared session store se check karta hai, apni memory se nahi.",
      "server>database": "Products, carts aur orders database mein hain, jo sab servers ke liye shared hai.",
    },
    done: "Koi bhi server koi bhi request handle kar sakta hai, kyunki login aur data unke bahar hain. Load balancer, session store aur database phir bhi dependencies hain jo fail ho sakti hain.",
  },

  followUps: [
    {
      q: "“Load balancer kya karta hai? Server down ho jaye toh?”",
      answer: [
        "Woh incoming traffic ko application servers tak route karta hai.",
        "Configured health checks unhealthy server detect kar sakte hain, aur nayi requests healthy servers ko ja sakti hain.",
        "Detection mein time lagta hai, aur fail hue server par chal rahi request ka result uncertain ho sakta hai.",
      ],
      say: "“Woh traffic servers tak route karta hai. Health checks ek ko unhealthy mark kar sakte hain aur nayi requests healthy ko jaati hain, par detection mein time lagta hai aur in-flight request uncertain ho sakti hai.”",
      deeper: "Days 10 aur 13",
    },
    {
      q: "“Stateless servers scaling mein kaise madad karte hain?”",
      answer: [
        "Request kisi ek server ki local session memory par depend nahi karti.",
        "Isliye traffic kisi bhi suitable healthy instance ko ja sakti hai, aur instances add ya replace karna aasan hai.",
        "Shared data aur uski availability phir bhi handle karni padti hai.",
      ],
      say: "“Stateless servers aasani se add ya replace ho sakte hain kyunki koi request ek server ki memory se bandhi nahi. Shared data ko available rakhna phir bhi padta hai.”",
      deeper: "Day 7",
    },
    {
      q: "“Sticky sessions ya shared session store?”",
      answer: [
        "Sticky sessions ek user ko ek server par rakhne ki koshish karte hain. Kaam kar sakte hain, par server fail hua toh session jaa sakta hai.",
        "Shared session store mein koi bhi server session verify kar sakta hai.",
        "Dono mein security sahi implement karni hogi, aur store ek dependency ban jaata hai.",
      ],
      say: "“Main shared session store chununga, kyunki koi ek server session nahi rakhta. Store ke apne failure ke liye phir bhi design karunga.”",
    },
  ],

  faq: [
    { q: "Kya load balancer kaam barabar baant deta hai?", a: "Zaroori nahi. Round robin requests baari-baari baantta hai, par chhoti aur badi request alag matra ka kaam hain. Least connections active connections ginta hai, jo exact compute load bhi nahi hai." },
    { q: "Kya health checks har failure turant pakad lete hain?", a: "Nahi. Woh configuration ke hisaab se failure detect karte hain, isliye delay ho sakta hai, aur policies alag hoti hain." },
    { q: "Kya token aur session store ek hi cheez hain?", a: "Alag approaches hain. Validated token signed-in user ko pehchanne ka ek aur tareeka hai. Dono mein security sahi implement karni hogi." },
  ],

  interview: [
    "Client, load balancer aur teen servers draw karo, response ka raasta wapas dikhate hue.",
    "Ek server ko unhealthy mark karo aur dikhao nayi requests kahan jaati hain.",
    "Batao ki in-flight write ka result unknown ho sakta hai.",
    "Session data ko shared store mein rakho, ek server ki memory mein nahi.",
    "Batao kya abhi bhi dependency hai: load balancer, session store, database.",
  ],

  cheatsheet: {
    title: "Day 4 · Load balancing",
    points: [
      "Load balancer requests ko available servers tak route karta hai",
      "Round robin: baari-baari. Least connections: active connections se",
      "Health check server ko unhealthy mark karta hai; detection turant nahi",
      "Fail hue server par chalti write ka result unknown hota hai",
      "Session shared store mein rakho, ek server ki memory mein nahi",
      "Balancer aur shared stores bhi dependencies hain",
    ],
  },

  linkedin:
    "Day 4/21: System Design Essentials with Klymb.\n\nTeen servers se ek naya sawaal aaya: agli request kis ke paas jayegi? Load balancer use route karta hai, health checks traffic ko unhealthy server se door rakhte hain, aur session shared store mein ho toh koi bhi server aapko handle kar sakta hai.\n\nYaad rakhna: load balancer, session store aur database bhi dependencies hain jo fail ho sakti hain.\n\n#SystemDesign #Klymb",

  nextDay: "Day 5: database ke andar. Products, carts aur orders kaise organise hote hain, aur unhe jaldi dhoondhna kyun zaroori hai.",
};

export const essentialsDayFour: Day = {
  day: 4,
  of: 21,
  app: "A shopping app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-4.mp4", poster: "/videos/system-design/essentials-day-4-poster.jpg", minutes: 6, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-4.mp4", poster: "/videos/system-design/essentials-day-4-poster.jpg" },
  },
};
