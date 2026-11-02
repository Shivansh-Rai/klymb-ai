/**
 * Day 1 of "System Design in 21 Days": Big Billion Day → predictable vs sudden load.
 * Every claim about Flipkart is from the public sources in `sources`; keep it that way.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  hookLines: [
    "Flipkart’s first Big Billion Day.",
    "The site buckled. Errors. Deals sold out in seconds.",
    "Then both founders emailed every customer to say sorry.",
  ],
  question: "The sale is coming back next year. You’re the engineer. What do you do?",

  pre: [
    {
      id: "pre-1",
      scenario: "The sale is 2 weeks away. Traffic at midnight is forecast to hit ~8x normal.",
      prompt: "What’s the FIRST thing you do?",
      choices: [
        {
          text: "Put capacity above the forecast in place early, and test at even more load than that",
          why: "This load is predictable: you know the date and time. Why wait to be surprised? Scale up and test weeks ahead.",
          best: true,
        },
        {
          text: "Turn on auto-scaling, so servers get added when the traffic arrives",
          why: "Auto-scaling matters, but new servers take minutes to boot and warm up. The midnight spike arrives in seconds.",
        },
        {
          text: "Add rate limiting so too many people can’t get in",
          why: "Not wrong, real systems use it. But it’s protection, not the plan. Capacity first, then limits.",
        },
        {
          text: "Get one huge, most powerful server",
          why: "One machine has a ceiling, and if it goes down everything goes with it (single point of failure).",
        },
      ],
    },
    {
      id: "pre-2",
      scenario: "Your web servers handle 10x traffic. Test passed.",
      prompt: "What could still sink the sale?",
      choices: [
        {
          text: "The systems behind them: stock database, payments, warehouse. The weakest link breaks first",
          why: "A chain is only as strong as its weakest link. Flipkart said as much in 2015: high QPS means nothing if the warehouse can’t pack.",
          best: true,
        },
        {
          text: "The load balancer in front of the servers",
          why: "Worth testing, but load balancers are usually the easiest part to scale. The heavier systems behind the servers (stock, payments) break first.",
        },
        {
          text: "Not enough bandwidth for product images",
          why: "A real concern, but images come from a CDN built for exactly this, and can be pushed out early. The bottleneck is usually inside the order path.",
        },
      ],
    },
    {
      id: "pre-3",
      scenario: "12:00:05 AM. Traffic is 2x even the forecast. Servers are full.",
      prompt: "Now what?",
      choices: [
        {
          text: "Let in as many as you can serve, show the rest a queue / 'please wait' page",
          why: "That’s graceful degradation: the system stays up and the people inside finish their orders. Trade-off: some people wait and a few leave, but nobody gets a broken checkout.",
          best: true,
        },
        {
          text: "Let everyone in and see what happens",
          why: "Under overload everything gets slow for everyone, then errors. That’s what happened in 2014.",
        },
        {
          text: "Add more servers right now",
          why: "Start it, yes. But new servers take minutes to boot, and you need something that works in the next 10 seconds: a waiting room.",
        },
      ],
    },
  ],

  revealTitle: "Flipkart, Big Billion Day 2015",
  revealSub: "what Flipkart actually did, then the standard pattern",
  sourceNote: "Source: Flipkart Stories (links at the bottom)",
  reveal: [
    { when: "~4 months before", what: "Preparation starts. Most of the last two months before code freeze go to infrastructure." },
    { when: "~1 month of tests", what: "Stress runs at 5x the projected numbers, across all systems." },
    { when: "Before launch", what: "Systems throttled slightly below the limits they had survived in tests." },
    { when: "On the order path", what: "An async queue so no order message is lost, and orders piped by each downstream system’s capacity." },
    { when: "When things fail", what: "Fallbacks, hot-standby nodes, replication. Sold-out items marked out of stock immediately." },
    { when: "During the sale", what: "Recalibrated alerts, live dashboards, playbooks and tiger teams on 24x7 shifts." },
  ],

  explain: {
    title: "The moves, explained",
    items: [
      { term: "Auto-scaling", what: "Adds servers automatically when load rises. New servers take minutes to start and warm up.", example: "Sudden, unplanned spikes" },
      { term: "Pre-scaling", what: "Adds servers before a known peak, so they are already warm when it hits.", example: "Sale midnight, IPL final" },
      { term: "Load testing", what: "Fake traffic far above the forecast, to find what breaks first, before real users do.", example: "Flipkart 2015: 5x the projected numbers" },
      { term: "Throttling", what: "Lets in only as much traffic as the system has proven it can handle; the rest waits.", example: "Waiting rooms, “please wait” pages" },
      { term: "Queue", what: "Lines up work so nothing is lost; each system takes it at its own pace.", example: "Orders, SMS, payment calls" },
      { term: "Graceful degradation", what: "Switch off the extras to keep the core working.", example: "Hide recommendations, keep checkout" },
    ],
  },

  concept: {
    cards: [{
      name: "Predictable load",
      examples: ["Big Billion Day midnight", "IPL final", "Tatkal at 10 AM", "Exam results"],
      moves: ["Forecast the peak", "Pre-scale and warm caches before it", "Load test well above the forecast", "Freeze code, write playbooks"],
    }, {
      name: "Sudden load",
      examples: ["A celebrity tweets your link", "A reel goes viral", "News breaks"],
      moves: ["Auto-scale (minutes, not seconds)", "Rate limit per user", "Queue or waiting room", "Shed or degrade non-essential features"],
    }],
    rule: "Real systems use both: pre-scale for the forecast, and keep protection for whatever goes past it.",
  },

  post: [
    {
      id: "post-1",
      scenario: "IRCTC Tatkal booking opens at 10:00 AM every day. Quiet at 9:59, peak at 10:00:02.",
      prompt: "What kind of load is this?",
      choices: [
        { text: "Predictable: same time every day, known in advance", why: "The spike is fast, but its time is fixed. So capacity should be ready by 9:45.", best: true },
        { text: "Sudden: it arrives in seconds", why: "Speed doesn’t decide the type. Do you know in advance? Yes, 10 AM every day." },
        { text: "Sudden, because the number of users changes every day", why: "The size varies a little, but the time never does: 10 AM, every day. Known time means predictable, so you can prepare." },
      ],
    },
    {
      id: "post-2",
      scenario: "10:00:05. Requests are 3x what the booking database can handle.",
      prompt: "Best move?",
      choices: [
        {
          text: "Waiting queue + per-user limit; process bookings at the database’s pace",
          why: "Give the database only what it can handle. Trade-off: people wait in line, but bookings stay correct and fair.",
          best: true,
        },
        { text: "Send every request to the database, it’ll sort it out", why: "An overloaded database gets slow for everyone, and it’s the first thing to break." },
        { text: "Add read replicas of the booking database", why: "Replicas help reads, like searching trains. But a booking is a write and must go to the main database. Copies don’t add write capacity." },
      ],
    },
    {
      id: "post-3",
      scenario: "A cricketer tweets a small app’s link with no warning. 50x traffic in 5 minutes.",
      prompt: "First line of defence?",
      choices: [
        {
          text: "Rate limit + serve what you can from cache + auto-scale on",
          why: "Sudden load: the time to pre-scale has passed. Protect, degrade, and hold on while you scale. Trade-off: some users see “try again in a minute” or a slightly old page, but the app stays up.",
          best: true,
        },
        { text: "Pre-scale", why: "Pre-scaling needs advance notice. There was no warning here." },
        { text: "Move the database to a bigger server", why: "Resizing a database usually means a restart or failover, in the middle of the spike. Protect what you have first." },
      ],
    },
    {
      id: "post-4",
      scenario: "To be safe, you pre-scaled to 10x capacity for the sale. Traffic actually peaked at 6x.",
      prompt: "What did that safety cost, and was it worth it?",
      choices: [
        { text: "A few hours of idle servers; worth it, because a crash costs sales and trust", why: "Pre-scaling trades money for safety. Spare servers for a night are cheap next to a 2014-style apology email. Scale back down after the peak.", best: true },
        { text: "Nothing: idle servers cost nothing", why: "Cloud servers bill by the hour, busy or not. The cost is real; it’s just smaller than the risk." },
        { text: "It was a mistake; you should have planned for exactly 6x", why: "Forecasts are never exact. Planning right at the forecast means any surprise knocks you over. Headroom is the point." },
      ],
    },
    {
      id: "post-5",
      scenario: "Before the sale you load-tested the web servers at 5x. Nobody tested the payment service.",
      prompt: "What’s the risk?",
      choices: [
        { text: "Payments become the weakest link: the sale stops at whatever payments can handle", why: "Every order passes through the whole chain. If payments hold at 2x, the sale holds at 2x, however strong the web servers are. Test every box an order touches.", best: true },
        { text: "None: if the web servers hold, everything behind them holds", why: "The web servers are only the front door. An order still needs the cart, stock, payment and warehouse behind them." },
        { text: "Only the payment page slows down; orders still go through", why: "No payment, no order. A slow payment step is a slow sale." },
      ],
    },
  ],

  estimates: [
    {
      id: "d1-est-1",
      given: ["48 lakh orders expected on sale day", "20% of them in the first hour"],
      prompt: "Orders per second in that first hour?",
      unit: "orders/sec",
      answer: 267,
      tolerance: 0.3,
      working: ["20% of 48 lakh = 9.6 lakh orders", "9.6 lakh ÷ 3,600 seconds ≈ 267 orders a second", "And the first minute is spikier still: plan capacity for several times this."],
    },
    {
      id: "d1-est-2",
      given: ["Orders arrive at 1,500 a second", "The payment partner processes 1,000 a second"],
      prompt: "After 60 seconds, how many orders are waiting in the queue?",
      unit: "orders",
      answer: 30000,
      tolerance: 0.15,
      working: ["The queue grows by 1,500 − 1,000 = 500 a second", "500 × 60 = 30,000 waiting", "It only drains once arrivals drop below 1,000/s. Show “processing”, and add a second provider."],
    },
    {
      id: "d1-est-3",
      given: ["10 lakh people open the sale page in the first minute", "Each page load is about 2 MB"],
      prompt: "What bandwidth does that need, in Gbps?",
      unit: "Gbps",
      answer: 267,
      tolerance: 0.3,
      working: ["10 lakh × 2 MB = 20 lakh MB = 2,000 GB in a minute", "2,000 GB ÷ 60 s ≈ 33 GB a second", "× 8 bits ≈ 267 Gbps. That’s why images live on a CDN across many cities, not on your servers."],
    },
  ],

  build: {
    title: "Plan the sale night",
    intro: "Drag each move to the moment it belongs to. You can also tap a move, then tap a slot.",
    given: "Big Billion Day · 12:00 AM",
    rows: [["forecast", "prescale", "loadtest"], ["throttle", "queue"], ["oos", "fallback"]],
    rowLabels: ["Before the sale", "At 12:00 AM", "When it breaks"],
    slots: {
      forecast: { role: "Weeks before: how big will the peak be?", answer: "forecast" },
      prescale: { role: "Days before: servers up and warm", answer: "prescale" },
      loadtest: { role: "Before launch: prove it holds above the forecast", answer: "loadtest" },
      throttle: { role: "At midnight: let in just under the tested limit", answer: "throttle" },
      queue: { role: "Orders pile up: line them up, lose none", answer: "queue" },
      oos: { role: "Stock runs out: stop selling it instantly", answer: "oos" },
      fallback: { role: "A system fails: switch to the backup", answer: "fallback" },
    },
    chips: [
      { id: "prescale", label: "Pre-scale", does: "adding servers and warming caches before the traffic arrives" },
      { id: "late", label: "Auto-scale at 11:59 PM", does: "too late: new servers take minutes to start, and the midnight spike takes seconds" },
      { id: "queue", label: "Async queue", does: "lining work up so nothing is lost, processed as fast as each system can take it" },
      { id: "forecast", label: "Forecast", does: "estimating how much traffic will come, from past sales and the marketing plan" },
      { id: "oos", label: "Mark out of stock", does: "stopping orders for items that are gone, so nobody pays for nothing" },
      { id: "loadtest", label: "Load test at 5x", does: "simulating far more traffic than expected to find what breaks first" },
      { id: "throttle", label: "Throttle", does: "letting in only as much traffic as the system has proven it can handle" },
      { id: "fallback", label: "Fallback / hot standby", does: "a ready backup that takes over when a system fails" },
    ],
    done: "That’s a sale-night plan. Most of these moves are in Flipkart’s own write-up of Big Billion Day 2015.",
  },

  design: {
    title: "The 1,000-phone flash sale",
    brief: "At 12:00 PM a flash sale opens: 1,000 phones at a huge discount. About 10 lakh people are waiting on the page. Design the system from the “Buy” tap to the confirmed order.",
    constraints: [
      "10 lakh users, most tapping in the first 10 seconds",
      "Exactly 1,000 phones: never sell 1,001",
      "The payment partner takes at most 2,000 requests a second",
      "Nobody is charged without getting a phone",
    ],
    minChars: 120,
    walkthrough: [
      { heading: "Requirements and numbers", points: ["Core path: tap Buy → reserve a phone → pay → confirm. Reviews and recommendations can switch off.", "10 lakh taps in ~10 seconds ≈ 1 lakh requests a second. Only 1,000 can win, so 99.9% should get a fast “sold out”, not a slow error."] },
      { heading: "Let in only what you can sell", points: ["A waiting room in front admits users in batches, a little more than the stock left.", "Rate limit per user and device, so bots and refresh-spammers don’t push out real buyers.", "Serve the sale page from a CDN, so loading it never touches your servers."] },
      { heading: "Never oversell", points: ["Keep one stock counter in a fast in-memory store and change it atomically: “reserve if count > 0” as a single step.", "A reservation holds a phone for, say, 5 minutes. If payment doesn’t finish, the phone goes back.", "Once the counter hits 0, answer “sold out” from the cache without touching the database."] },
      { heading: "Payments at the partner’s pace", points: ["Only reserved users reach payment: about 1,000 calls, well under 2,000 a second.", "One idempotency key per reservation, so a retry or double tap never charges twice.", "If the partner fails, release the phone, tell the user honestly, and reconcile payments afterwards."] },
      { heading: "Trade-offs to say out loud", points: ["Exact stock at checkout (correct, slightly slower); a few-seconds-stale “left” count on the page (fast).", "A waiting room is less exciting than a free-for-all, but it’s fair and it survives.", "Expiring reservations mean a phone can reappear after “sold out”. Say so in the UI."] },
    ],
    checklist: [
      "I estimated the peak (around 1 lakh requests a second)",
      "I protected the system up front: waiting room, rate limit or CDN",
      "I used one atomic stock counter, so it can’t oversell",
      "I kept payment calls under the partner’s limit",
      "I handled retries and double taps (idempotency)",
      "I named at least one trade-off",
    ],
  },

  followUps: [
    {
      q: "“You planned for 8x. At midnight it’s 15x. What now?”",
      answer: [
        "Protect the core path first: browse, cart, payment. Everything else can wait.",
        "Throttle at the tested limit and send the rest to a waiting room or queue, with a clear message.",
        "Switch off non-essential features (recommendations, reviews) to free capacity.",
        "Auto-scaling keeps adding servers in the background; the waiting room holds people until it catches up.",
      ],
      say: "“Admit what we can serve, queue the rest with a clear message, and switch off non-essentials to protect checkout while we scale.”",
      deeper: "Days 7 and 18",
    },
    {
      q: "“Your payment partner can only take 2,000 requests a second. Sale traffic is 10 times that. How do you design around it?”",
      answer: [
        "Never send more than the partner can take: rate limit the calls to it.",
        "Queue payment requests and process them at the partner’s pace; show the user “processing”.",
        "Add a second payment provider and split traffic between them.",
        "Make every payment attempt idempotent, so a retry never charges twice.",
      ],
      say: "“Queue payment calls at the partner’s rate, show a processing state, spread across providers, and make every attempt idempotent.”",
      deeper: "Days 8 and 13",
    },
    {
      q: "“How would you know the system is about to break, before users do?”",
      answer: [
        "Know the limits first: load tests tell you where each system breaks.",
        "Watch the signs live: requests per second, the slowest response times, error rate, queue length.",
        "Alert well before the limit (say at 70%), not when it’s already down.",
        "Keep a playbook for each alert, so the team acts in minutes.",
      ],
      say: "“Load-test to know the limits, put the key signals on a dashboard, alert well below the limit, and keep a playbook for each alert.”",
      deeper: "Day 18",
    },
    {
      q: "“Now marketing wants the \u2018X left\u2019 badge on every product page to be exact, to the phone. What changes?”",
      answer: [
        "Exact on every view means every page view reads the one stock counter: lakhs of reads a second on your most critical store.",
        "Push back first: “Few left”, updated every few seconds, is honest and costs almost nothing.",
        "If it must be exact: keep the counter in a fast in-memory store, push changes over a live connection, and keep these reads off the database.",
        "Checkout must always be exact. The badge doesn’t have to be.",
      ],
      say: "“Checkout stays strongly consistent; the badge can be a few seconds stale. If it must be exact, it reads an in-memory counter, never the database.”",
      deeper: "Days 10 and 16",
    },
  ],

  faq: [
    { q: "If I have auto-scaling, why pre-scale at all?", a: "Auto-scaling reacts in minutes: machines boot, warm up, join the pool. A sale spike arrives in seconds. By the time the new servers are ready the deal is gone and customers have already seen errors. A known peak is warmed before it, not during it." },
    { q: "How much headroom should the load test cover?", a: "A multiple of the forecast, not the forecast. Teams usually take two to three times, because the forecast is a guess and traffic never arrives evenly. Test the whole path too — one slow downstream service sets your real capacity." },
    { q: "Isn’t rate limiting just turning customers away?", a: "It is, and it is the kinder option. Without it everyone gets a slow, failing site. With it most people get a working site and some get “try again in a moment”. Throttle a little below what you actually tested." },
    { q: "What does “degrade gracefully” mean in practice?", a: "Switch off the parts nobody buys with: recommendations, reviews, the live counter. Keep search, cart and payment alive. Decide that list before the sale, because nobody makes good calls at 2 a.m. with the site on fire." },
  ],

  interview: [
    "First ask: is this load predictable? (Do we know the date and time?)",
    "Predictable: forecast → pre-scale → load test well above the forecast → code freeze.",
    "Check the whole chain: web, cache, DB, payments, inventory. Weakest link first.",
    "If the forecast breaks: rate limit, queue / waiting room, switch off non-essential features.",
    "Sudden load: auto-scale + cache + rate limit, because there’s no time to pre-scale.",
  ],

  cheatsheet: {
    title: "Day 1 · Predictable vs sudden load",
    points: [
      "First question: do you know when the peak comes?",
      "Yes → pre-scale, warm up, test at a multiple of the forecast",
      "No → auto-scale + rate limit + queue + degrade",
      "Auto-scaling takes minutes; spikes take seconds",
      "Weakest downstream system sets your real capacity",
      "Throttle a little below what you tested",
    ],
  },

  linkedin:
    "Day 1/21 of System Design with Klymb.\n\nFlipkart’s first Big Billion Day (2014) buckled under load. For 2015 they started ~4 months early and ran stress tests at 5x the projected traffic for about a month.\n\nWhat I learned: first ask whether the load is predictable. If you know when the peak comes, pre-scale and test well above it. If you don’t, auto-scale, rate limit, queue and degrade. Good systems do both.\n\n#SystemDesign #Klymb",

  nextDay: "Swiggy dinner rush: everyone orders at 8 PM. How do you spread the load?",
};

const hi: DayCopy = {
  hookLines: [
    "Flipkart ka pehla Big Billion Day.",
    "Site baith gayi. Errors. Deals seconds mein sold out.",
    "Phir dono founders ne har customer ko email karke sorry bola.",
  ],
  question: "Agle saal sale phir aa rahi hai. Tum engineer ho. Kya karoge?",

  pre: [
    {
      id: "pre-1",
      scenario: "Sale 2 hafte baad hai. Midnight par traffic normal se ~8x jaane ka forecast hai.",
      prompt: "Sabse PEHLA kaam kya karoge?",
      choices: [
        {
          text: "Forecast se upar capacity pehle hi khadi karo, aur usse bhi zyada load par test karo",
          why: "Load predictable hai: date aur time pata hai. To surprise ka wait kyun? Weeks pehle scale up karo aur test karo.",
          best: true,
        },
        {
          text: "Auto-scaling on kar do, traffic aayega to servers khud badh jayenge",
          why: "Auto-scaling zaroori hai, par naye servers ko boot aur warm hone mein minutes lagte hain. Midnight ka spike seconds mein aata hai.",
        },
        {
          text: "Rate limiting laga do taaki zyada log andar hi na aa sakein",
          why: "Galat nahi hai, real systems lagate hain. Par yeh protection hai, plan nahi. Pehle capacity, phir limit.",
        },
        {
          text: "Ek bahut bada, sabse powerful server le aao",
          why: "Ek machine ki ek limit hoti hai, aur woh gir gayi to sab gaya (single point of failure).",
        },
      ],
    },
    {
      id: "pre-2",
      scenario: "Tumhare web servers 10x traffic sambhal lete hain. Test pass.",
      prompt: "Sale phir bhi kis wajah se fail ho sakti hai?",
      choices: [
        {
          text: "Peeche wale systems: stock database, payments, warehouse. Sabse kamzor kadi pehle tootegi",
          why: "Chain utni hi strong jitni uski weakest link. Flipkart ne 2015 mein yahi likha: QPS ka koi matlab nahi agar warehouse pack hi na kar paaye.",
          best: true,
        },
        {
          text: "Servers ke aage wala load balancer",
          why: "Test karna chahiye, par load balancer aksar scale karne mein sabse aasaan hota hai. Servers ke peeche ke bhaari systems (stock, payments) pehle tootte hain.",
        },
        {
          text: "Product images ke liye bandwidth kam padegi",
          why: "Sahi chinta hai, par images CDN se aati hain jo isi kaam ke liye bana hai, aur pehle se push ho sakti hain. Bottleneck aksar order path ke andar hota hai.",
        },
      ],
    },
    {
      id: "pre-3",
      scenario: "12:00:05 AM. Traffic forecast se bhi 2x upar chala gaya. Servers full.",
      prompt: "Ab kya karoge?",
      choices: [
        {
          text: "Jitna serve kar sakte ho utna andar lo, baaki ko queue / 'thoda ruko' page dikhao",
          why: "Yeh graceful degradation hai: system zinda rehta hai aur jo andar hain unka order poora hota hai. Trade-off: kuch log wait karte hain, kuch chale jaate hain, par kisi ka checkout tootta nahi.",
          best: true,
        },
        {
          text: "Sabko andar aane do, jaisa hoga dekha jayega",
          why: "Overload mein sab ke liye sab slow ho jata hai, phir errors. 2014 mein yahi hua tha.",
        },
        {
          text: "Abhi ke abhi aur servers jodo",
          why: "Shuru zaroor karo. Par naye servers ko boot hone mein minutes lagte hain, aur tumhe agle 10 second mein kuch chahiye: waiting room.",
        },
      ],
    },
  ],

  revealTitle: "Flipkart, Big Billion Day 2015",
  revealSub: "Flipkart ne asal mein kya kiya, phir standard pattern",
  sourceNote: "Source: Flipkart Stories (links neeche hain)",
  reveal: [
    { when: "~4 mahine pehle", what: "Taiyaari shuru. Code freeze se pehle ke aakhri do mahine zyada tar infrastructure par gaye." },
    { when: "~1 mahine tak tests", what: "Saare systems par projected numbers ke 5x par stress tests." },
    { when: "Launch se pehle", what: "Systems ko test mein jhele gaye limit se thoda neeche throttle kiya." },
    { when: "Order path par", what: "Async queue taaki koi order message na khoye, aur har system ko uski capacity ke hisaab se orders." },
    { when: "Jab kuch fail ho", what: "Fallbacks, hot-standby nodes, replication. Sold-out items turant out of stock mark." },
    { when: "Sale ke dauraan", what: "Naye sire se set alerts, live dashboards, playbooks aur 24x7 tiger teams." },
  ],

  explain: {
    title: "Moves, aasaan bhasha mein",
    items: [
      { term: "Auto-scaling", what: "Load badhne pe servers apne aap judte hain. Naye servers ko start aur warm hone mein minutes lagte hain.", example: "Achanak, bina plan ke spikes" },
      { term: "Pre-scaling", what: "Pata hua peak aane se pehle servers jod do, taaki woh pehle se warm hon.", example: "Sale ki midnight, IPL final" },
      { term: "Load testing", what: "Forecast se kaafi zyada nakli traffic, taaki pata chale pehle kya tootega, real users se pehle.", example: "Flipkart 2015: projected ka 5 guna" },
      { term: "Throttling", what: "Utna hi traffic andar, jitna system ne test mein jhela hai; baaki wait karte hain.", example: "Waiting rooms, “thoda ruko” pages" },
      { term: "Queue", what: "Kaam line mein lagta hai taaki kuch na khoye; har system apni speed se uthata hai.", example: "Orders, SMS, payment calls" },
      { term: "Graceful degradation", what: "Extras band karo taaki core chalta rahe.", example: "Recommendations chhupao, checkout chalne do" },
    ],
  },

  concept: {
    cards: [{
      name: "Predictable load",
      examples: ["Big Billion Day midnight", "IPL final", "Tatkal 10 baje", "Exam results"],
      moves: ["Peak ka forecast karo", "Usse pehle scale up karo, cache warm karo", "Forecast se kaafi upar load test", "Code freeze, playbooks likho"],
    }, {
      name: "Sudden load",
      examples: ["Celebrity ne tumhara link tweet kiya", "Reel viral ho gayi", "Breaking news"],
      moves: ["Auto-scale (minutes lagte hain, seconds nahi)", "Per user rate limit", "Queue ya waiting room", "Faltu features band ya halke karo"],
    }],
    rule: "Real systems dono karte hain: forecast ke liye pre-scale, aur usse upar ke liye protection.",
  },

  post: [
    {
      id: "post-1",
      scenario: "IRCTC Tatkal booking roz subah 10:00 baje khulti hai. 9:59 par traffic kam, 10:00:02 par peak.",
      prompt: "Yeh kis type ka load hai?",
      choices: [
        { text: "Predictable: roz same time, pehle se pata hai", why: "Spike tez hai, par uska time fixed hai. Isliye 9:45 tak capacity ready honi chahiye.", best: true },
        { text: "Sudden: seconds mein aata hai", why: "Speed se type decide nahi hota. Kya tum pehle se jaante ho? Haan, roz 10 baje." },
        { text: "Sudden, kyunki users ki ginti roz badalti hai", why: "Size thoda badalta hai, time kabhi nahi: roz 10 baje. Time pata hai matlab predictable, toh taiyaari ho sakti hai." },
      ],
    },
    {
      id: "post-2",
      scenario: "10:00:05. Requests, booking database ki capacity se 3x zyada.",
      prompt: "Best move?",
      choices: [
        {
          text: "Waiting queue + per-user limit; database ki speed par bookings process karo",
          why: "Database ko utna hi do jitna woh sambhal sake. Trade-off: log line mein wait karte hain, par bookings sahi aur fair rehti hain.",
          best: true,
        },
        { text: "Sab requests database par bhej do, woh sort kar lega", why: "Overloaded database sab ke liye slow ho jata hai, aur woh tootne wali pehli cheez hai." },
        { text: "Booking database ke read replicas bana do", why: "Replicas reads mein madad karte hain, jaise trains search karna. Par booking ek write hai, main database pe hi jaati hai. Copies se write capacity nahi badhti." },
      ],
    },
    {
      id: "post-3",
      scenario: "Ek cricketer ne bina bataye ek chhote app ka link tweet kar diya. 5 minute mein 50x traffic.",
      prompt: "Pehli line of defence?",
      choices: [
        {
          text: "Rate limit + jo cache se serve ho sake woh cache se + auto-scale on",
          why: "Sudden load: pre-scale ka time nikal chuka. Protect karo, degrade karo, aur scale hone tak tik ke raho. Trade-off: kuch users ko “ek minute baad try karo” ya thoda purana page dikhega, par app chalta rahega.",
          best: true,
        },
        { text: "Pre-scale kar do", why: "Pre-scaling ke liye pehle se pata hona chahiye. Yahan warning hi nahi mili." },
        { text: "Database ko bade server pe shift karo", why: "Database resize karne mein aksar restart ya failover hota hai, wo bhi spike ke beech mein. Pehle jo hai use bachao." },
      ],
    },
    {
      id: "post-4",
      scenario: "Safe rehne ke liye tumne sale ke liye 10x capacity pre-scale ki. Traffic ka peak asal mein 6x aaya.",
      prompt: "Is safety ki keemat kya thi, aur kya worth it tha?",
      choices: [
        { text: "Kuch ghante khaali servers ka kharcha; worth it, kyunki crash se sales aur bharosa dono jaate hain", why: "Pre-scaling paise ke badle safety hai. Ek raat ke spare servers 2014 jaisi sorry email ke saamne saste hain. Peak ke baad wapas scale down karo.", best: true },
        { text: "Kuch nahi: khaali servers ka kharcha nahi hota", why: "Cloud servers ghante ke hisaab se bill hote hain, busy hon ya nahi. Kharcha asli hai; bas risk se chhota hai." },
        { text: "Galti thi; exactly 6x ka plan karna chahiye tha", why: "Forecast kabhi exact nahi hota. Bilkul forecast pe plan kiya toh koi bhi surprise gira dega. Headroom hi toh point hai." },
      ],
    },
    {
      id: "post-5",
      scenario: "Sale se pehle tumne web servers ko 5x par load test kiya. Payment service ko kisi ne test nahi kiya.",
      prompt: "Risk kya hai?",
      choices: [
        { text: "Payments sabse kamzor kadi ban jaate hain: sale wahi ruk jaati hai jahan payments ruk jaayein", why: "Har order poori chain se guzarta hai. Payments 2x pe ruke, toh sale bhi 2x pe rukegi, web servers kitne bhi strong hon. Order jis bhi box ko chhoota hai, sab test karo.", best: true },
        { text: "Koi nahi: web servers chal gaye toh peeche sab chalega", why: "Web servers sirf darwaza hain. Order ko peeche cart, stock, payment aur warehouse bhi chahiye." },
        { text: "Sirf payment page slow hoga, orders phir bhi ho jaayenge", why: "Payment nahi, toh order nahi. Slow payment matlab slow sale." },
      ],
    },
  ],

  estimates: [
    {
      id: "d1-est-1",
      given: ["Sale ke din 48 lakh orders expected", "Unmein se 20% pehle ghante mein"],
      prompt: "Us pehle ghante mein orders per second?",
      unit: "orders/sec",
      answer: 267,
      tolerance: 0.3,
      working: ["48 lakh ka 20% = 9.6 lakh orders", "9.6 lakh ÷ 3,600 second ≈ 267 orders per second", "Aur pehla minute isse bhi zyada spiky hota hai: capacity iska kai guna rakho."],
    },
    {
      id: "d1-est-2",
      given: ["Orders 1,500 per second aa rahe hain", "Payment partner 1,000 per second process karta hai"],
      prompt: "60 second baad queue mein kitne orders wait kar rahe honge?",
      unit: "orders",
      answer: 30000,
      tolerance: 0.15,
      working: ["Queue har second 1,500 − 1,000 = 500 badhti hai", "500 × 60 = 30,000 wait mein", "Yeh tabhi khaali hogi jab orders 1,000/s se neeche aayein. “Processing” dikhao, aur doosra provider jodo."],
    },
    {
      id: "d1-est-3",
      given: ["Pehle minute mein 10 lakh log sale page kholte hain", "Har page load lagbhag 2 MB"],
      prompt: "Kitni bandwidth chahiye, Gbps mein?",
      unit: "Gbps",
      answer: 267,
      tolerance: 0.3,
      working: ["10 lakh × 2 MB = 20 lakh MB = 2,000 GB ek minute mein", "2,000 GB ÷ 60 s ≈ 33 GB per second", "× 8 bits ≈ 267 Gbps. Isiliye images kai shehron mein CDN pe rehti hain, tumhare servers pe nahi."],
    },
  ],

  build: {
    title: "Sale ki raat plan karo",
    intro: "Har move ko uske sahi waqt pe drag karo. Ya move tap karo, phir slot tap karo.",
    given: "Big Billion Day · 12:00 AM",
    rows: [["forecast", "prescale", "loadtest"], ["throttle", "queue"], ["oos", "fallback"]],
    rowLabels: ["Before the sale", "At 12:00 AM", "When it breaks"],
    slots: {
      forecast: { role: "Hafton pehle: peak kitna bada hoga?", answer: "forecast" },
      prescale: { role: "Din pehle: servers taiyaar aur warm", answer: "prescale" },
      loadtest: { role: "Launch se pehle: forecast se upar test", answer: "loadtest" },
      throttle: { role: "Midnight pe: tested limit se thoda neeche andar lo", answer: "throttle" },
      queue: { role: "Orders ka dher: line mein lagao, kuch na khoye", answer: "queue" },
      oos: { role: "Stock khatam: turant bechna band", answer: "oos" },
      fallback: { role: "Koi system gira: backup pe shift", answer: "fallback" },
    },
    chips: [
      { id: "prescale", label: "Pre-scale", does: "traffic aane se pehle servers jodna aur cache warm karna" },
      { id: "late", label: "11:59 PM pe auto-scale", does: "bahut der: naye servers minutes lete hain, midnight ka spike seconds mein aata hai" },
      { id: "queue", label: "Async queue", does: "kaam line mein, kuch nahi khota, har system apni speed se uthata hai" },
      { id: "forecast", label: "Forecast", does: "pichli sales aur marketing plan se andaaza ki kitna traffic aayega" },
      { id: "oos", label: "Out of stock mark", does: "khatam items ke orders band, taaki koi bina saamaan ke pay na kare" },
      { id: "loadtest", label: "5x load test", does: "umeed se kaafi zyada nakli traffic, taaki pata chale pehle kya tootega" },
      { id: "throttle", label: "Throttle", does: "utna hi traffic andar jitna system ne test mein jhela hai" },
      { id: "fallback", label: "Fallback / hot standby", does: "ready backup jo system girne pe sambhal le" },
    ],
    done: "Yeh hai sale ki raat ka plan. Inmein se zyada tar moves Flipkart ke Big Billion Day 2015 write-up mein hain.",
  },

  design: {
    title: "1,000 phones ki flash sale",
    brief: "Dopahar 12:00 baje flash sale khulti hai: 1,000 phones bhaari discount pe. Lagbhag 10 lakh log page pe wait kar rahe hain. “Buy” tap se confirmed order tak system design karo.",
    constraints: [
      "10 lakh users, zyada tar pehle 10 second mein tap karenge",
      "Exactly 1,000 phones: 1,001 kabhi nahi bikna chahiye",
      "Payment partner max 2,000 requests per second leta hai",
      "Bina phone ke kisi ka paisa nahi katna chahiye",
    ],
    minChars: 120,
    walkthrough: [
      { heading: "Requirements aur numbers", points: ["Core path: Buy tap → phone reserve → pay → confirm. Reviews aur recommendations band ho sakte hain.", "10 lakh taps ~10 second mein ≈ 1 lakh requests per second. Jeetenge sirf 1,000, toh 99.9% ko tez “sold out” milna chahiye, slow error nahi."] },
      { heading: "Utna hi andar lo jitna bech sako", points: ["Aage ek waiting room jo users ko batches mein andar le, bache stock se thoda zyada.", "Per user aur device rate limit, taaki bots aur refresh-spammers asli buyers ko na dhakel dein.", "Sale page CDN se, taaki use load karna tumhare servers tak pahunche hi nahi."] },
      { heading: "Kabhi oversell nahi", points: ["Ek hi stock counter, fast in-memory store mein, aur use atomically badlo: “count > 0 ho toh reserve” ek hi step mein.", "Reservation phone ko lagbhag 5 minute pakad ke rakhta hai. Payment poora nahi hua toh phone wapas stock mein.", "Counter 0 hote hi “sold out” cache se do, database ko chhue bina."] },
      { heading: "Payments partner ki speed se", points: ["Sirf reserved users payment tak pahunchte hain: lagbhag 1,000 calls, 2,000 per second se kaafi neeche.", "Har reservation ki ek idempotency key, taaki retry ya double tap pe do baar paisa na kate.", "Partner fail ho toh phone release karo, user ko saaf batao, aur baad mein payments reconcile karo."] },
      { heading: "Trade-offs jo bolke batao", points: ["Checkout pe exact stock (sahi, thoda slow); page pe “left” count kuch second purana (fast).", "Waiting room free-for-all jitna exciting nahi, par fair hai aur tikta hai.", "Expire hone wale reservations se “sold out” ke baad phone wapas dikh sakta hai. UI mein batao."] },
    ],
    checklist: [
      "Maine peak estimate kiya (lagbhag 1 lakh requests per second)",
      "Maine system ko aage se bachaya: waiting room, rate limit ya CDN",
      "Maine ek atomic stock counter rakha, taaki oversell na ho",
      "Maine payment calls partner ki limit ke neeche rakhi",
      "Maine retries aur double taps handle kiye (idempotency)",
      "Maine kam se kam ek trade-off bataya",
    ],
  },

  followUps: [
    {
      q: "“Tumne 8x ka plan kiya. Midnight pe 15x aa gaya. Ab?”",
      answer: [
        "Pehle core path bachao: browse, cart, payment. Baaki sab ruk sakta hai.",
        "Tested limit pe throttle karo, baaki ko waiting room ya queue mein bhejo, saaf message ke saath.",
        "Faltu features (recommendations, reviews) band karo taaki capacity bache.",
        "Auto-scaling peeche servers jodta rahe; waiting room tab tak logon ko sambhale.",
      ],
      say: "“Jitna serve kar sakte hain utna andar, baaki saaf message ke saath queue mein, aur scale hone tak checkout bachane ke liye extras band.”",
      deeper: "Days 7 aur 18",
    },
    {
      q: "“Payment partner sirf 2,000 requests per second le sakta hai. Sale traffic usse 10 guna hai. Kaise design karoge?”",
      answer: [
        "Partner ki limit se zyada kabhi mat bhejo: uski calls pe rate limit.",
        "Payment requests queue mein, partner ki speed se process; user ko “processing” dikhao.",
        "Doosra payment provider jodo aur traffic baanto.",
        "Har payment attempt idempotent rakho, taaki retry pe do baar paise na kate.",
      ],
      say: "“Payment calls partner ki speed se queue mein, processing state dikhao, providers mein baanto, aur har attempt idempotent.”",
      deeper: "Days 8 aur 13",
    },
    {
      q: "“Users se pehle tumhe kaise pata chalega ki system tootne wala hai?”",
      answer: [
        "Pehle limits jaano: load tests batate hain har system kahan tootta hai.",
        "Live signs dekho: requests per second, sabse slow responses, error rate, queue length.",
        "Limit se kaafi pehle alert (jaise 70% pe), gir jaane ke baad nahi.",
        "Har alert ke liye playbook ready, taaki team minutes mein act kare.",
      ],
      say: "“Load test se limits jaano, key signals dashboard pe, limit se kaafi neeche alert, aur har alert ka playbook.”",
      deeper: "Day 18",
    },
    {
      q: "“Ab marketing chahti hai ki har product page pe \u2018X left\u2019 badge bilkul exact ho, ek ek phone tak. Kya badlega?”",
      answer: [
        "Har view pe exact matlab har page view ek hi stock counter padhega: tumhare sabse critical store pe lakhon reads per second.",
        "Pehle push back karo: “Few left”, har kuch second mein update, honest hai aur lagbhag free hai.",
        "Exact chahiye hi toh: counter fast in-memory store mein, changes live connection pe push, aur yeh reads database se door.",
        "Checkout hamesha exact hona chahiye. Badge ko zaroorat nahi.",
      ],
      say: "“Checkout strongly consistent rahega; badge kuch second purana chal sakta hai. Exact chahiye toh in-memory counter se padhega, database se kabhi nahi.”",
      deeper: "Days 10 aur 16",
    },
  ],

  faq: [
    { q: "Auto-scaling hai toh pre-scale karne ki zaroorat kya hai?", a: "Auto-scaling minutes mein react karta hai: machine boot hoti hai, warm hoti hai, pool mein judti hai. Sale ka spike seconds mein aata hai. Jab tak naye servers taiyaar honge, deal khatam aur customers ko errors mil chuke honge. Jo peak pata hai, woh pehle se warm hota hai." },
    { q: "Load test kitne traffic pe karna chahiye?", a: "Forecast ka multiple, sirf forecast nahi. Log aam taur pe do se teen guna lete hain, kyunki forecast ek andaaza hai aur traffic barabar nahi aata. Poora raasta test karo — ek slow downstream service hi tumhari asli capacity tay karti hai." },
    { q: "Rate limiting matlab customers ko bhaga dena hi hua na?", a: "Haan, aur yahi behtar option hai. Bina iske sabko slow aur girta hua site milta hai. Iske saath zyada logon ko chalta hua site milta hai aur kuch ko “thodi der mein try karo”. Jitna test kiya hai, throttle usse thoda neeche rakho." },
    { q: "“Degrade” asal mein kya karna hota hai?", a: "Woh hisse band karo jinse koi kharidta nahi: recommendations, reviews, live counter. Search, cart aur payment chalu rakho. Yeh list sale se pehle banao, kyunki raat 2 baje jalte hue site pe achhe faisle nahi hote." },
  ],

  interview: [
    "Pehle poocho: kya yeh load predictable hai? (date/time pata hai?)",
    "Predictable: forecast → pre-scale → forecast se kaafi upar load test → code freeze.",
    "Pura chain dekho: web, cache, DB, payments, inventory. Sabse kamzor kadi pehle.",
    "Forecast toota to: rate limit, queue / waiting room, non-essential features band.",
    "Sudden load: auto-scale + cache + rate limit, kyunki pre-scale ka time nahi.",
  ],

  cheatsheet: {
    title: "Day 1 · Predictable vs sudden load",
    points: [
      "Pehla sawaal: kya peak ka time pata hai?",
      "Pata hai → pre-scale, warm up, forecast ke kai guna par test",
      "Nahi pata → auto-scale + rate limit + queue + degrade",
      "Auto-scaling mein minutes lagte hain; spike seconds mein aata hai",
      "Sabse kamzor downstream system hi tumhari asli capacity hai",
      "Jitna test kiya, usse thoda neeche throttle karo",
    ],
  },

  linkedin:
    "Day 1/21: System Design with Klymb.\n\nFlipkart ka pehla Big Billion Day (2014) load mein baith gaya tha. 2015 ke liye unhone ~4 mahine pehle taiyaari shuru ki aur ~1 mahine tak projected traffic ke 5x par stress tests chalaye.\n\nMera takeaway: pehle poocho, load predictable hai ya nahi. Peak ka time pata hai to pre-scale karo aur usse kaafi upar test karo. Nahi pata to auto-scale, rate limit, queue aur degrade. Achhe systems dono karte hain.\n\n#SystemDesign #Klymb",

  nextDay: "Swiggy dinner rush: 8 baje sab ek saath order karte hain. Load kaise baantoge?",
};

export const dayOne: Day = {
  day: 1,
  of: 21,
  app: "Flipkart",
  minutes: 15,
  hook: {
    date: "6 Oct 2014",
    quote: "We did not live up to the promises we made.",
    quoteBy: "Sachin & Binny Bansal, apology email, Oct 2014",
  },
  copy: { en, hi },
  sources: [
    { label: "Flipkart Stories: TBBD Throwback, The Big Billion Day 2015", href: "https://stories.flipkart.com/tbbd-throwback-the-big-billion-day-2015/" },
    { label: "BOOM: Flipkart issues apology for Big Billion Day fiasco (2014)", href: "https://www.boomlive.in/flipkart-issues-apology-big-billion-day-fiasco/" },
  ],
  video: {
    src: "/api/video/day-1.mp4", poster: "/videos/system-design/day-1-poster.jpg", minutes: 3, lang: "Hinglish",
    wide: { src: "/api/video/day-1-wide.mp4", poster: "/videos/system-design/day-1-wide-poster.jpg" },
  },
  prevHref: "/system-design/day-0",
};
