/**
 * Day 3 of "System Design Essentials": why an app slows down when the sale starts.
 * Built from the Day 3 video script. The shop and every number in it are
 * fictional teaching examples, not any company's real traffic or design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 3 · Why apps slow down",
  hookLines: [
    "Yesterday the shopping app was fine.",
    "Today the sale starts, and the product page takes forever.",
    "Where is the problem: the app server, the database, or the network?",
  ],
  question: "You can’t tell yet. What would you measure first?",

  pre: [
    {
      id: "pre-1",
      scenario: "The sale has started and the product page is slow. Nobody knows why yet.",
      prompt: "What’s the best first move?",
      choices: [
        { text: "Look at traffic and response times, then compare the app server, database and network", why: "Yes. Find where the slowness is, with evidence, before changing anything.", best: true },
        { text: "Add more servers straight away", why: "If the real limit is the database, more app servers won’t fix it. Measure first." },
        { text: "Restart the database", why: "That’s a guess. Without evidence you might make things worse." },
      ],
    },
    {
      id: "pre-2",
      scenario: "The shop has 100 registered users. In one second, 10 requests arrive.",
      prompt: "Does that mean 100 people are using the app right now?",
      choices: [
        { text: "No: registered users, requests per second and requests in progress are different measurements", why: "Right. Registered users is a headcount. Requests per second is a rate. Requests in progress is how many are overlapping at one moment.", best: true },
        { text: "Yes, every registered user is using it", why: "Having an account doesn’t mean using the app this second." },
        { text: "Only if the server is slow", why: "Speed doesn’t change what the numbers mean." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Out of 100 requests, 95 take 300 ms and 5 take 2 seconds. The average looks fine.",
      prompt: "What does the average hide?",
      choices: [
        { text: "The slow experiences: some users wait far longer than the average suggests", why: "Exactly. The average smooths over the five slow requests, which are real people waiting.", best: true },
        { text: "Nothing: the average tells the whole story", why: "An average mixes fast and slow into one number, so it can look fine while some users suffer." },
        { text: "That the server is down", why: "Slow successes aren’t failures. The requests did complete." },
      ],
    },
  ],

  revealTitle: "From “the app is slow” to a cause",
  revealSub: "a fictional sale, a simplified investigation",
  reveal: [
    { when: "Measure first", what: "Traffic and response times show that something is slow. They don’t say where." },
    { when: "Three different numbers", what: "100 registered users, 10 requests arriving in a second, and 3 requests in progress at one moment are separate measurements." },
    { when: "Average vs peak", what: "100,000 requests in 10 minutes (600 seconds) is about 167 per second on average. The first seconds of a sale can be far higher, so the average alone can’t size the servers." },
    { when: "The slow few", what: "If 95 requests take 300 ms and 5 take 2 s, the 95th percentile (p95) is 300 ms. The average hides the five." },
    { when: "Find the bottleneck", what: "High server CPU with fast queries points at the app server. Normal CPU with a 2-second query points at the database. Leads, not proof." },
    { when: "Change one thing, measure again", what: "Bigger server (vertical) or more instances (horizontal), then check whether it helped." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Latency", what: "How long one request waits, from sending it to receiving the response.", example: "The product page takes 2 seconds to appear" },
      { term: "Throughput", what: "How much work gets completed in a given time.", example: "100 requests completed per second" },
      { term: "Concurrency", what: "Requests whose work overlaps in time, started but not yet finished.", example: "3 requests in progress at one moment" },
      { term: "p95 (95th percentile)", what: "The time that 95% of requests finish within. It shows the slow tail that an average hides.", example: "95 of 100 requests done within 300 ms" },
      { term: "Bottleneck", what: "The stage whose limited capacity restricts the whole flow, like one checkout counter in a busy shop.", example: "A database query that takes 2 seconds" },
      { term: "Vertical vs horizontal scaling", what: "Vertical: give one server more CPU or memory. Horizontal: add more server instances.", example: "A bigger counter, or more counters" },
    ],
  },

  concept: {
    cards: [{
      name: "Vertical scaling",
      examples: ["A bigger, faster server", "More CPU or memory on one instance"],
      moves: ["Relatively simple to do", "Still has a capacity limit and a cost", "One machine is still one machine"],
    }, {
      name: "Horizontal scaling",
      examples: ["More application server instances", "Several counters instead of one"],
      moves: ["Adds capacity by adding instances", "Traffic must be shared between them", "Shared data has to be handled"],
    }],
    rule: "Measure first, change one thing, then measure again.",
  },

  estimates: [
    {
      id: "est-1",
      prompt: "100,000 requests arrive over 10 minutes. About how many requests per second is that on average?",
      given: ["100,000 requests in total", "10 minutes = 600 seconds"],
      unit: "requests per second",
      answer: 167,
      tolerance: 0.15,
      working: ["10 minutes × 60 = 600 seconds.", "100,000 ÷ 600 ≈ 167 requests per second.", "That’s an average. The peak, in the first seconds of a sale, could be much higher, so it must be measured or estimated separately."],
    },
  ],

  post: [
    {
      id: "post-1",
      prompt: "What is latency?",
      choices: [
        { text: "How long one request takes, from sending it to getting the response", why: "Yes: the waiting time of a single request.", best: true },
        { text: "How many requests the system completes per second", why: "That’s throughput." },
        { text: "How many users have an account", why: "That’s a user count, not a performance measure." },
      ],
    },
    {
      id: "post-2",
      scenario: "The application completes 100 requests every second.",
      prompt: "Which measurement is this?",
      choices: [
        { text: "Throughput", why: "Yes: how much work is completed in a given time.", best: true },
        { text: "Latency", why: "Latency is one request’s waiting time, not a count per second." },
        { text: "Concurrency", why: "Concurrency is how many requests overlap at a moment." },
      ],
    },
    {
      id: "post-3",
      scenario: "At one instant, 3 requests have started but not finished.",
      prompt: "What are they?",
      choices: [
        { text: "Concurrent: their work overlaps", why: "Right. Started but not finished, at the same time.", best: true },
        { text: "Failed requests", why: "They’re still being served; nothing says they failed." },
        { text: "The throughput", why: "Throughput counts completed work over time, not what’s in progress." },
      ],
    },
    {
      id: "post-4",
      scenario: "Users see a slow page. Server CPU is normal, but one database query takes 2 seconds.",
      prompt: "Where should you investigate?",
      choices: [
        { text: "The query and data access in the database", why: "Yes. The evidence points there. It’s a lead to confirm, not proof.", best: true },
        { text: "Add more application servers", why: "The app servers aren’t the limit here, so more of them won’t fix a slow query." },
        { text: "The user’s phone", why: "Nothing in the evidence points at the client." },
      ],
    },
    {
      id: "post-5",
      prompt: "Which one is horizontal scaling?",
      choices: [
        { text: "Adding more application server instances", why: "Yes: more instances share the work.", best: true },
        { text: "Giving the one server more CPU and memory", why: "That’s vertical scaling." },
        { text: "Waiting for traffic to drop", why: "That isn’t scaling." },
      ],
    },
  ],

  build: {
    title: "Investigate the slow sale",
    intro: "Put the steps of the investigation in order. You can also tap a step, then tap a slot.",
    given: "The sale page is slow",
    rows: [["measure", "compare", "find"], ["change", "again"]],
    rowLabels: ["Find the cause", "Fix it"],
    slots: {
      measure: { role: "Look at traffic and response times", answer: "measure" },
      compare: { role: "Compare app server, database and network metrics", answer: "compare" },
      find: { role: "Name the stage that limits the whole flow", answer: "find" },
      change: { role: "Pick a change that fits the cause", answer: "change" },
      again: { role: "Check whether it actually helped", answer: "again" },
    },
    chips: [
      { id: "find", label: "Find the bottleneck", does: "naming the stage whose limited capacity restricts the flow" },
      { id: "guess", label: "Add servers straight away", does: "acting before knowing the cause, which can miss the real limit" },
      { id: "again", label: "Measure again", does: "checking the numbers after the change" },
      { id: "measure", label: "Measure traffic and response times", does: "getting evidence that something is slow, and how slow" },
      { id: "change", label: "Scale up or add instances", does: "a change chosen for the bottleneck you found" },
      { id: "compare", label: "Compare the metrics", does: "checking the app server, database and network side by side" },
    ],
    done: "Measure, compare, find the bottleneck, change one thing, measure again. That’s the loop.",
  },

  followUps: [
    {
      q: "“The shopping app is slow during a sale. What will you do?”",
      answer: [
        "Don’t jump to “add servers”. Say what you’d measure first.",
        "Look at traffic and response times, then compare the app server, database and network.",
        "Find the bottleneck, choose a change for it, and measure again.",
      ],
      say: "“I’d look at traffic and response times, compare the app server, database and network, fix where the bottleneck is, then measure again.”",
      deeper: "Days 4 and 10",
    },
    {
      q: "“What’s the difference between vertical and horizontal scaling?”",
      answer: [
        "Vertical: give the existing server more resources. Horizontal: add more instances.",
        "Vertical can be simpler but has a limit and a cost.",
        "Horizontal adds capacity, but then traffic has to be shared and shared data handled.",
      ],
      say: "“Vertical gives one server more resources; horizontal adds instances. The choice depends on workload, cost and complexity.”",
      deeper: "Day 4",
    },
    {
      q: "“Average response time is 300 ms, but users complain. Why?”",
      answer: [
        "An average hides the slow few: some users may wait seconds.",
        "Look at percentiles such as p95, the time 95% of requests finish within.",
        "Then look at what the slowest requests have in common.",
      ],
      say: "“An average hides the slow tail. I’d look at p95 and what the slow requests share.”",
    },
  ],

  faq: [
    { q: "Is a slow page the same as a failed request?", a: "No. A slow success is latency: the request completed, late. A failure is when the service can’t serve the request. Availability is about how often the service is usable under defined conditions, and its target has to be specified." },
    { q: "Can I decide the number of servers from the user count?", a: "Not from the user count alone. You also need the request rate, how much work overlaps, the work each request does, and the peak." },
    { q: "Are these numbers real?", a: "No. The shop and every number are fictional teaching examples, not any company’s real traffic or design." },
  ],

  interview: [
    "Start with evidence: traffic and response times.",
    "Compare the app server, database and network to find the bottleneck.",
    "Pick a change that fits the cause: vertical or horizontal, and say the trade-off.",
    "Measure again to confirm it helped.",
    "Mention p95, not just the average.",
  ],

  cheatsheet: {
    title: "Day 3 · Why apps slow down",
    points: [
      "Latency: one request’s wait. Throughput: work done per time",
      "Concurrency: requests overlapping at a moment",
      "Average rate isn’t the peak",
      "p95 shows the slow tail an average hides",
      "Bottleneck: the stage that limits the whole flow",
      "Measure, change one thing, measure again",
    ],
  },

  linkedin:
    "Day 3/21 of System Design Essentials with Klymb.\n\nThe sale starts and the app slows down. The first move isn’t “add servers”: it’s measure. Latency is one request’s wait, throughput is work completed per second, and an average can hide the slow few that p95 shows.\n\nFind the bottleneck, change one thing, then measure again.\n\n#SystemDesign #Klymb",

  nextDay: "Day 4: three servers are up. Which one gets the next request, and what if one fails?",
};

const hi: DayCopy = {
  tag: "Day 3 · App slow kyun hoti hai",
  hookLines: [
    "Kal tak shopping app theek chal rahi thi.",
    "Aaj sale shuru hui, aur product page khulne mein bahut time lag raha hai.",
    "Problem kahan hai: app server, database, ya network?",
  ],
  question: "Abhi pata nahi chal sakta. Sabse pehle kya measure karoge?",

  pre: [
    {
      id: "pre-1",
      scenario: "Sale shuru ho gayi aur product page slow hai. Abhi kisi ko nahi pata kyun.",
      prompt: "Sabse achha pehla step kya hai?",
      choices: [
        { text: "Traffic aur response times dekho, phir app server, database aur network compare karo", why: "Haan. Kuch badalne se pehle evidence se dhoondho ki slowness kahan hai.", best: true },
        { text: "Seedha aur servers add kar do", why: "Agar asli limit database hai, toh aur app servers se fark nahi padega. Pehle measure karo." },
        { text: "Database restart kar do", why: "Yeh andaza hai. Evidence ke bina haalat aur kharab ho sakti hai." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Shop par 100 registered users hain. Ek second mein 10 requests aati hain.",
      prompt: "Kya iska matlab abhi 100 log app use kar rahe hain?",
      choices: [
        { text: "Nahi: registered users, requests per second aur requests in progress alag measurements hain", why: "Sahi. Registered users headcount hai. Requests per second rate hai. Requests in progress woh hain jo ek moment par overlap kar rahi hain.", best: true },
        { text: "Haan, har registered user use kar raha hai", why: "Account hona matlab is second app use karna nahi hai." },
        { text: "Sirf agar server slow ho", why: "Speed se numbers ka matlab nahi badalta." },
      ],
    },
    {
      id: "pre-3",
      scenario: "100 requests mein se 95 ko 300 ms lage aur 5 ko 2 seconds. Average theek dikhta hai.",
      prompt: "Average kya chhupata hai?",
      choices: [
        { text: "Slow experiences: kuch users ko average se bahut zyada wait karna padta hai", why: "Bilkul. Average un paanch slow requests ko smooth kar deta hai, jo asli log hain.", best: true },
        { text: "Kuch nahi: average poori kahani batata hai", why: "Average fast aur slow ko ek number mein mila deta hai, isliye theek dikhte hue bhi kuch users ko dikkat ho sakti hai." },
        { text: "Ki server down hai", why: "Slow success failure nahi hai. Requests complete hui hain." },
      ],
    },
  ],

  revealTitle: "“App slow hai” se cause tak",
  revealSub: "ek fictional sale, simplified investigation",
  reveal: [
    { when: "Pehle measure", what: "Traffic aur response times batate hain ki kuch slow hai. Yeh nahi batate ki kahan." },
    { when: "Teen alag numbers", what: "100 registered users, ek second mein 10 requests, aur ek moment par 3 requests in progress alag measurements hain." },
    { when: "Average vs peak", what: "10 minute (600 seconds) mein 100,000 requests matlab average lagbhag 167 per second. Sale ke pehle seconds mein yeh kaafi zyada ho sakta hai, isliye sirf average se server count decide nahi hota." },
    { when: "Slow thode se", what: "Agar 95 requests 300 ms lein aur 5 ko 2 s, toh 95th percentile (p95) 300 ms hai. Average un paanch ko chhupa deta hai." },
    { when: "Bottleneck dhoondo", what: "Server CPU high aur queries fast: app server dekho. CPU normal aur query 2 second: database dekho. Yeh leads hain, proof nahi." },
    { when: "Ek cheez badlo, dobara measure", what: "Bada server (vertical) ya zyada instances (horizontal), phir check karo ki fark pada ya nahi." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Latency", what: "Ek request ka waiting time, request bhejne se response milne tak.", example: "Product page aane mein 2 seconds" },
      { term: "Throughput", what: "Ek given time mein kitna kaam complete hua.", example: "Har second 100 requests complete" },
      { term: "Concurrency", what: "Woh requests jinka kaam time mein overlap karta hai: shuru ho chuki, par complete nahi.", example: "Ek moment par 3 requests in progress" },
      { term: "p95 (95th percentile)", what: "Woh time jiske andar 95% requests complete hoti hain. Yeh slow tail dikhata hai jo average chhupa deta hai.", example: "100 mein se 95 requests 300 ms ke andar" },
      { term: "Bottleneck", what: "Woh stage jiski limited capacity poore flow ko rokti hai, jaise busy shop mein ek hi checkout counter.", example: "2 second lene wali database query" },
      { term: "Vertical vs horizontal scaling", what: "Vertical: ek server ko zyada CPU ya memory do. Horizontal: aur server instances add karo.", example: "Bada counter, ya zyada counters" },
    ],
  },

  concept: {
    cards: [{
      name: "Vertical scaling",
      examples: ["Bada, tez server", "Ek instance par zyada CPU ya memory"],
      moves: ["Karna relatively simple", "Phir bhi capacity limit aur cost hai", "Ek machine phir bhi ek machine hai"],
    }, {
      name: "Horizontal scaling",
      examples: ["Zyada application server instances", "Ek ki jagah kai counters"],
      moves: ["Instances add karke capacity badhti hai", "Traffic unke beech baantna padta hai", "Shared data handle karna padta hai"],
    }],
    rule: "Pehle measure karo, ek cheez badlo, phir dobara measure karo.",
  },

  estimates: [
    {
      id: "est-1",
      prompt: "10 minute mein 100,000 requests aati hain. Average mein lagbhag kitni requests per second hui?",
      given: ["Kul 100,000 requests", "10 minute = 600 seconds"],
      unit: "requests per second",
      answer: 167,
      tolerance: 0.15,
      working: ["10 minute × 60 = 600 seconds.", "100,000 ÷ 600 ≈ 167 requests per second.", "Yeh average hai. Sale ke pehle seconds mein peak kaafi zyada ho sakta hai, isliye use alag se measure ya estimate karna padega."],
    },
  ],

  post: [
    {
      id: "post-1",
      prompt: "Latency kya hai?",
      choices: [
        { text: "Ek request ko kitna time laga, bhejne se response milne tak", why: "Haan: ek request ka waiting time.", best: true },
        { text: "System har second kitni requests complete karta hai", why: "Yeh throughput hai." },
        { text: "Kitne users ka account hai", why: "Yeh user count hai, performance measure nahi." },
      ],
    },
    {
      id: "post-2",
      scenario: "Application har second 100 requests complete karti hai.",
      prompt: "Yeh kaunsa measurement hai?",
      choices: [
        { text: "Throughput", why: "Haan: ek given time mein kitna kaam complete hua.", best: true },
        { text: "Latency", why: "Latency ek request ka waiting time hai, per second count nahi." },
        { text: "Concurrency", why: "Concurrency woh hai jo ek moment par overlap kar rahi requests ki ginti hai." },
      ],
    },
    {
      id: "post-3",
      scenario: "Ek pal par 3 requests shuru ho chuki hain par complete nahi hui.",
      prompt: "Yeh kya hain?",
      choices: [
        { text: "Concurrent: unka kaam overlap kar raha hai", why: "Sahi. Shuru ho chuki, complete nahi, ek hi samay par.", best: true },
        { text: "Failed requests", why: "Woh abhi serve ho rahi hain; kuch nahi kehta ki fail hui." },
        { text: "Throughput", why: "Throughput time mein complete hua kaam gintaa hai, jo chal raha hai woh nahi." },
      ],
    },
    {
      id: "post-4",
      scenario: "Users ko page slow dikh raha hai. Server CPU normal hai, par ek database query 2 seconds le rahi hai.",
      prompt: "Kahan investigate karna chahiye?",
      choices: [
        { text: "Database mein query aur data access", why: "Haan. Evidence wahin ishaara karta hai. Yeh lead hai jise confirm karna hai, proof nahi.", best: true },
        { text: "Aur application servers add karo", why: "Yahan app servers limit nahi hain, isliye aur servers slow query theek nahi karenge." },
        { text: "User ka phone", why: "Evidence mein kuch client ki taraf ishara nahi karta." },
      ],
    },
    {
      id: "post-5",
      prompt: "Inmein se horizontal scaling kaunsi hai?",
      choices: [
        { text: "Aur application server instances add karna", why: "Haan: zyada instances kaam baant leti hain.", best: true },
        { text: "Ek server ko zyada CPU aur memory dena", why: "Yeh vertical scaling hai." },
        { text: "Traffic kam hone ka wait karna", why: "Yeh scaling nahi hai." },
      ],
    },
  ],

  build: {
    title: "Slow sale ki investigation karo",
    intro: "Investigation ke steps ko sahi order mein lagao. Ya step tap karo, phir slot tap karo.",
    given: "Sale page slow hai",
    rows: [["measure", "compare", "find"], ["change", "again"]],
    rowLabels: ["Cause dhoondo", "Theek karo"],
    slots: {
      measure: { role: "Traffic aur response times dekho", answer: "measure" },
      compare: { role: "App server, database aur network metrics compare karo", answer: "compare" },
      find: { role: "Woh stage batao jo poore flow ko rokti hai", answer: "find" },
      change: { role: "Cause ke hisaab se change chuno", answer: "change" },
      again: { role: "Check karo ki sach mein fark pada", answer: "again" },
    },
    chips: [
      { id: "find", label: "Bottleneck dhoondo", does: "woh stage batana jiski limited capacity flow ko rokti hai" },
      { id: "guess", label: "Seedha servers add karo", does: "cause jaane bina action lena, jisse asli limit chhoot sakti hai" },
      { id: "again", label: "Dobara measure karo", does: "change ke baad numbers check karna" },
      { id: "measure", label: "Traffic aur response times measure karo", does: "evidence lena ki kuch slow hai, aur kitna" },
      { id: "change", label: "Scale up ya instances add", does: "jo bottleneck mila uske liye chuna hua change" },
      { id: "compare", label: "Metrics compare karo", does: "app server, database aur network ko saath dekhna" },
    ],
    done: "Measure, compare, bottleneck dhoondo, ek cheez badlo, dobara measure. Yahi loop hai.",
  },

  followUps: [
    {
      q: "“Sale ke time shopping app slow hai. Aap kya karenge?”",
      answer: [
        "Seedha “servers add karenge” mat kaho. Batao pehle kya measure karoge.",
        "Traffic aur response times dekho, phir app server, database aur network compare karo.",
        "Bottleneck dhoondo, uske liye change chuno, aur dobara measure karo.",
      ],
      say: "“Main traffic aur response times dekhunga, app server, database aur network compare karunga, jahan bottleneck ho wahan fix karunga, phir dobara measure karunga.”",
      deeper: "Days 4 aur 10",
    },
    {
      q: "“Vertical aur horizontal scaling mein kya difference hai?”",
      answer: [
        "Vertical: maujooda server ko zyada resources. Horizontal: aur instances add karna.",
        "Vertical simple ho sakta hai par limit aur cost hai.",
        "Horizontal capacity badhata hai, par traffic baantna aur shared data handle karna padta hai.",
      ],
      say: "“Vertical ek server ko zyada resources deta hai; horizontal instances add karta hai. Choice workload, cost aur complexity par depend karti hai.”",
      deeper: "Day 4",
    },
    {
      q: "“Average response time 300 ms hai, phir bhi users complain kar rahe hain. Kyun?”",
      answer: [
        "Average slow thode se ko chhupa deta hai: kuch users seconds wait kar sakte hain.",
        "Percentiles dekho, jaise p95: woh time jiske andar 95% requests complete hoti hain.",
        "Phir dekho slowest requests mein kya common hai.",
      ],
      say: "“Average slow tail chhupa deta hai. Main p95 dekhunga aur yeh ki slow requests mein kya common hai.”",
    },
  ],

  faq: [
    { q: "Kya slow page aur failed request ek hi hain?", a: "Nahi. Slow success latency hai: request complete hui, late. Failure tab hai jab service request serve hi nahi kar paati. Availability yeh dekhti hai ki service defined conditions mein kitni usable hai, aur uska target specify karna padta hai." },
    { q: "Kya user count se server count decide ho sakta hai?", a: "Sirf user count se nahi. Request rate, kitna kaam overlap karta hai, har request ka workload, aur peak bhi chahiye." },
    { q: "Kya yeh numbers asli hain?", a: "Nahi. Shop aur har number fictional teaching examples hain, kisi company ka real traffic ya design nahi." },
  ],

  interview: [
    "Evidence se shuru karo: traffic aur response times.",
    "App server, database aur network compare karke bottleneck dhoondo.",
    "Cause ke hisaab se change chuno: vertical ya horizontal, aur trade-off batao.",
    "Dobara measure karke confirm karo ki fark pada.",
    "Sirf average nahi, p95 bhi mention karo.",
  ],

  cheatsheet: {
    title: "Day 3 · App slow kyun hoti hai",
    points: [
      "Latency: ek request ka wait. Throughput: time mein hua kaam",
      "Concurrency: ek moment par overlap karti requests",
      "Average rate peak nahi hota",
      "p95 woh slow tail dikhata hai jo average chhupa deta hai",
      "Bottleneck: woh stage jo poore flow ko rokti hai",
      "Measure, ek cheez badlo, dobara measure",
    ],
  },

  linkedin:
    "Day 3/21: System Design Essentials with Klymb.\n\nSale shuru hui aur app slow ho gayi. Pehla step “servers add karo” nahi, measure karna hai. Latency ek request ka wait hai, throughput har second complete hua kaam, aur average woh slow thode requests chhupa deta hai jo p95 dikhata hai.\n\nBottleneck dhoondo, ek cheez badlo, phir dobara measure karo.\n\n#SystemDesign #Klymb",

  nextDay: "Day 4: teen servers ho gaye. Agli request kis ke paas jayegi, aur ek fail ho jaye toh?",
};

export const essentialsDayThree: Day = {
  day: 3,
  of: 21,
  app: "A shopping app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-3.mp4", poster: "/videos/system-design/essentials-day-3-poster.jpg", minutes: 7, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-3.mp4", poster: "/videos/system-design/essentials-day-3-poster.jpg" },
  },
};
