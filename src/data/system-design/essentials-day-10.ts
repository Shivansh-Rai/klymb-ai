/**
 * Day 10 of "System Design Essentials": reliability and handling overload.
 * Built from the Day 10 video script. The cricket streaming app is a fictional
 * teaching example, not any company's real design.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 10 · Reliability and overload",
  hookLines: [
    "A fictional cricket app. The last over is on.",
    "The recommendations service has gone slow.",
    "Should the match stop for it?",
  ],
  question: "Which parts of the app really need to work, and what should happen when one doesn’t?",

  pre: [
    {
      id: "pre-1",
      scenario: "In the last over of a match, the recommendations panel is slow. Playback is fine.",
      prompt: "What should happen to the match?",
      choices: [
        { text: "It keeps playing: recommendations are useful but not critical", why: "Right. Features aren’t equally critical, so the core experience should survive a slow extra.", best: true },
        { text: "It stops until recommendations load", why: "That lets a non-critical feature break the core one." },
        { text: "Everyone gets access without checks, to be safe", why: "Never skip required access checks to ‘be safe’. That’s a separate security decision." },
      ],
    },
    {
      id: "pre-2",
      scenario: "A call to another service times out.",
      prompt: "What does a timeout tell you?",
      choices: [
        { text: "You stopped waiting; the other side may or may not have finished the work", why: "Right. The request may have completed, with the response lost or late.", best: true },
        { text: "The other service definitely did nothing", why: "It may have finished. You just didn’t get the answer in time." },
        { text: "The other service is permanently broken", why: "A timeout doesn’t say that." },
      ],
    },
    {
      id: "pre-3",
      scenario: "A service is slow, and a thousand clients all retry again and again, right away.",
      prompt: "What’s the risk?",
      choices: [
        { text: "The retries add load to an already busy service and can make it worse", why: "Yes. That’s why retries need limits, growing waits and a little variation.", best: true },
        { text: "Nothing: retrying always helps", why: "Blind, immediate retries can pile on." },
        { text: "The clients’ phones overheat", why: "That’s not the issue." },
      ],
    },
  ],

  revealTitle: "Expecting failure",
  revealSub: "a fictional streaming app, simplified",
  reveal: [
    { when: "What’s critical", what: "Playback and required access checks matter most. Recommendation cards are useful, but the match can play without them." },
    { when: "Timeout and retry", what: "A timeout sets a maximum wait. A retry tries again, which can suit a temporary issue and some reads. A write like a payment risks a duplicate, so it needs a stable idempotency key." },
    { when: "Backoff", what: "Limit the attempts and increase the wait between them, with a little variation, so clients don’t all hit again at the same instant. Some errors, like invalid input, aren’t worth retrying." },
    { when: "Circuit breaker", what: "After repeated failures the breaker opens, so calls are rejected or sent to a fallback for a while. After a wait, a limited test call checks if the service recovered." },
    { when: "Degrade gracefully", what: "Keep the core useful when a non-critical feature is down: a ‘temporarily unavailable’ placeholder while playback continues. A failed access check is a separate decision." },
    { when: "Redundancy, limits, observing", what: "Two servers can cover one failing, but a shared database can still fail. Rate limiting caps requests. Metrics, logs and traces tell you what’s wrong." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Timeout", what: "A maximum wait for a response. It doesn’t mean the other side did nothing.", example: "Give up on recommendations after a short wait" },
      { term: "Retry and idempotency key", what: "A retry tries again. Reads can be safe to retry in some cases; a write like a payment needs a stable idempotency key so a repeat doesn’t duplicate.", example: "Repeat a read, not a blind payment" },
      { term: "Backoff", what: "Increasing the wait between limited retries, with some variation.", example: "Wait 1s, then 2s, then 4s, a little randomised" },
      { term: "Circuit breaker", what: "After repeated failures, temporarily stop calling the failing dependency, then test it with a limited call after a wait.", example: "Open, test, close again on recovery" },
      { term: "Graceful degradation", what: "Keeping the core experience useful when a non-critical feature is unavailable.", example: "Placeholder cards, playback continues" },
      { term: "Rate limiting (token bucket)", what: "A policy limiting how many requests a client may make. In a token bucket, each request uses a token and tokens refill over time.", example: "Empty bucket: reject or wait" },
    ],
  },

  concept: {
    cards: [{
      name: "Protect the core",
      examples: ["Playback and required access checks", "Placeholders for non-critical features"],
      moves: ["Rank features by how critical they are", "Degrade the extras, not the core", "Never skip access checks"],
    }, {
      name: "Protect the dependency",
      examples: ["Timeouts and limited retries", "Backoff, circuit breaker, rate limiting"],
      moves: ["Don’t wait forever", "Don’t pile on a struggling service", "Mind wrong limits blocking valid users"],
    }],
    rule: "Reliability means expecting failure and deciding the behaviour in advance.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Which request is generally safest to retry?",
      choices: [
        { text: "A read request, in some cases", why: "Right. A write like a payment risks a duplicate and needs a stable idempotency key.", best: true },
        { text: "A payment, immediately and blindly", why: "A blind repeat can duplicate the effect." },
        { text: "Any request with invalid input", why: "Invalid input will keep failing, so it isn’t worth retrying." },
      ],
    },
    {
      id: "post-2",
      prompt: "What is backoff?",
      choices: [
        { text: "Limiting attempts and increasing the wait between them, with a little variation", why: "Yes. It stops clients hitting a struggling service all at once.", best: true },
        { text: "Retrying as fast as possible", why: "That piles on." },
        { text: "Never trying again", why: "That’s giving up, not backoff." },
      ],
    },
    {
      id: "post-3",
      prompt: "What does an open circuit breaker do?",
      choices: [
        { text: "Temporarily stops calls to the failing dependency, then tests with a limited call after a wait", why: "Right. It saves resources and lets the service recover.", best: true },
        { text: "Repairs the failing service", why: "It doesn’t cure the failure." },
        { text: "Lets everyone in without checks", why: "That has nothing to do with it." },
      ],
    },
    {
      id: "post-4",
      scenario: "Recommendations are down, but playback works.",
      prompt: "What’s graceful degradation here?",
      choices: [
        { text: "Show a placeholder for recommendations while playback continues", why: "Yes. A failed access check, though, is a separate decision that isn’t automatically allowed.", best: true },
        { text: "Stop the stream until recommendations return", why: "That lets a minor feature break the main one." },
        { text: "Skip the access check so the match plays", why: "Never assume allowing access is safe." },
      ],
    },
    {
      id: "post-5",
      prompt: "What’s the risk of a token bucket limit set too low?",
      choices: [
        { text: "Valid users can be blocked too", why: "Right. A limit must fit real use.", best: true },
        { text: "Nothing: lower is always safer", why: "A wrong limit hurts real users." },
        { text: "The tokens never refill", why: "They refill over time by design." },
      ],
    },
  ],

  build: {
    title: "Protect the streaming app",
    intro: "Drag each protection to the problem it answers. You can also tap one, then tap a slot.",
    given: "The recommendations service is slow",
    rows: [["timeout", "retry", "breaker"], ["degrade", "limit"]],
    rowLabels: ["When a dependency is slow", "Keep the core, cap the load"],
    slots: {
      timeout: { role: "Don’t wait forever for a slow service", answer: "timeout" },
      retry: { role: "Try again a limited number of times, with growing waits", answer: "retry" },
      breaker: { role: "Stop calling a failing service for a while", answer: "breaker" },
      degrade: { role: "Show a placeholder while playback continues", answer: "degrade" },
      limit: { role: "Cap how many requests a client can send", answer: "limit" },
    },
    chips: [
      { id: "limit", label: "Rate limiting", does: "capping how many requests a client may make, for example with a token bucket" },
      { id: "spam", label: "Retry every error immediately", does: "piling load on a struggling service, and retrying errors that can’t succeed" },
      { id: "timeout", label: "Timeout", does: "setting a maximum wait for a response" },
      { id: "degrade", label: "Graceful degradation", does: "keeping the core useful when a non-critical feature is down" },
      { id: "breaker", label: "Circuit breaker", does: "temporarily stopping calls to a failing dependency" },
      { id: "retry", label: "Retry with backoff", does: "limited attempts with growing, slightly varied waits" },
    ],
    done: "Timeout, limited retries with backoff, a circuit breaker, graceful degradation and rate limiting, each answering a different problem.",
  },

  design: {
    title: "The recommendations service goes slow",
    brief: "An interviewer asks: “If the recommendation service gets slow, how should the streaming app behave?” Write your answer: what you protect, what you’d add, and how you’d know.",
    constraints: [
      "Playback and required access checks must keep working",
      "Don’t make the slow service worse",
      "Say how you’d notice the problem",
    ],
    minChars: 100,
    walkthrough: [
      { heading: "One possible answer", points: ["Put a timeout on the calls.", "Consider safe, limited retries with backoff, and a circuit breaker after repeated failures.", "Show a placeholder for recommendations; handle playback and required access checks by their own requirements.", "Monitor latency and errors."] },
      { heading: "If asked how you’d notice", points: ["Metrics show the trend: error rate and response time.", "Traces show which hop is slow; logs add the detail."] },
    ],
    checklist: [
      "I put a timeout on the calls",
      "I mentioned limited retries with backoff",
      "I mentioned a circuit breaker",
      "I kept playback and access checks separate from recommendations",
      "I said how I’d monitor it",
    ],
  },

  followUps: [
    {
      q: "“The recommendation service gets slow. How does the streaming app behave?”",
      answer: [
        "Timeouts on the calls, with safe, limited retries and backoff.",
        "A circuit breaker after repeated failures.",
        "A placeholder for recommendations; playback and required access checks handled by their own requirements; and monitoring of latency and errors.",
      ],
      say: "“Timeouts, limited retries, a circuit breaker, a placeholder for recommendations, playback and access checks handled on their own terms, and monitoring.”",
      deeper: "Days 11 and 14",
    },
    {
      q: "“A payment call times out. Do you just retry?”",
      answer: [
        "A timeout doesn’t mean it failed: it may have completed with the response lost.",
        "Retrying a payment blindly risks a duplicate.",
        "Use a stable idempotency key and understand the provider’s behaviour.",
      ],
      say: "“A timeout doesn’t mean it failed. I’d retry only with a stable idempotency key, so a repeat can’t charge twice.”",
      deeper: "Day 13",
    },
    {
      q: "“How would you know something’s wrong?”",
      answer: [
        "Metrics show trends, like error rate and response time.",
        "Traces show a request’s journey across services, so you can find the slow hop.",
        "Logs give the detail of individual events. Use them together.",
      ],
      say: "“Metrics tell me when it got worse, traces tell me which hop is slow, and logs give the context.”",
    },
  ],

  faq: [
    { q: "Does a second server make the system reliable?", a: "It helps if a server fails and capacity and routing are set up. But if both depend on the same unavailable database, the database is still a failure point." },
    { q: "Should a failed access check let the user in?", a: "No. Allowing access automatically on failure isn’t a safe assumption. That decision comes from security and product requirements." },
    { q: "Is the streaming app a real design?", a: "No. It’s a fictional teaching example." },
  ],

  interview: [
    "Rank features: what’s critical and what can degrade.",
    "Timeouts, then limited, safe retries with backoff.",
    "A circuit breaker for repeated failures.",
    "Graceful degradation, and keep access checks separate.",
    "Rate limiting, and metrics, logs and traces to see it.",
  ],

  cheatsheet: {
    title: "Day 10 · Reliability and overload",
    points: [
      "Not every feature is equally critical",
      "A timeout doesn’t mean the other side did nothing",
      "Limited retries with backoff; writes need an idempotency key",
      "A circuit breaker stops calling a failing service for a while",
      "Degrade gracefully; never skip required access checks",
      "Metrics, logs and traces show what’s wrong",
    ],
  },

  linkedin:
    "Day 10/21 of System Design Essentials with Klymb.\n\nA slow recommendations service shouldn’t stop the match. Rank what’s critical; use timeouts, limited retries with backoff, a circuit breaker, graceful degradation and rate limiting.\n\nAnd remember: a timeout doesn’t mean it failed, and access checks are never skipped to be safe.\n\n#SystemDesign #Klymb",

  nextDay: "Day 11: a notification system. Accepted, sent and actually delivered are three different things.",
};

const hi: DayCopy = {
  tag: "Day 10 · Reliability aur overload",
  hookLines: [
    "Ek fictional cricket app. Last over chal raha hai.",
    "Recommendations service slow ho gayi.",
    "Kya match uski wajah se ruk jana chahiye?",
  ],
  question: "App ke kaunse parts ka chalna sach mein zaroori hai, aur ek ke na chalne par kya hona chahiye?",

  pre: [
    {
      id: "pre-1",
      scenario: "Match ke last over mein recommendations panel slow hai. Playback theek hai.",
      prompt: "Match ka kya hona chahiye?",
      choices: [
        { text: "Woh chalta rahe: recommendations useful hain par critical nahi", why: "Sahi. Features barabar critical nahi hote, isliye core experience ko ek slow extra se bachna chahiye.", best: true },
        { text: "Recommendations load hone tak ruk jaye", why: "Isse ek non-critical feature core wale ko tod deta hai." },
        { text: "Safe rehne ke liye sabko bina check ke access de do", why: "‘Safe’ rehne ke naam par required access checks kabhi skip mat karo. Woh alag security decision hai." },
      ],
    },
    {
      id: "pre-2",
      scenario: "Doosri service ko ki gayi call timeout ho jaati hai.",
      prompt: "Timeout aapko kya batata hai?",
      choices: [
        { text: "Aapne wait karna band kiya; doosri side ne kaam kiya ho bhi sakta hai, nahi bhi", why: "Sahi. Request complete hui ho sakti hai, response lost ya late hua ho.", best: true },
        { text: "Doosri service ne definitely kuch nahi kiya", why: "Woh kar chuki ho sakti hai. Bas jawab time par nahi mila." },
        { text: "Doosri service hamesha ke liye kharab hai", why: "Timeout yeh nahi batata." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Ek service slow hai, aur hazaar clients bar-bar turant retry kar rahe hain.",
      prompt: "Risk kya hai?",
      choices: [
        { text: "Retries pehle se busy service par aur load daalti hain aur use bigaad sakti hain", why: "Haan. Isliye retries ko limits, badhte waits aur thodi variation chahiye.", best: true },
        { text: "Kuch nahi: retry hamesha madad karta hai", why: "Andha, turant retry load badha sakta hai." },
        { text: "Clients ke phones garam ho jaate hain", why: "Yeh issue nahi hai." },
      ],
    },
  ],

  revealTitle: "Failure ki umeed rakhna",
  revealSub: "ek fictional streaming app, simplified",
  reveal: [
    { when: "Kya critical hai", what: "Playback aur required access checks sabse zaroori hain. Recommendation cards useful hain, par match unke bina chal sakta hai." },
    { when: "Timeout aur retry", what: "Timeout maximum wait set karta hai. Retry dobara try karta hai, jo temporary issue aur kuch reads ke liye theek ho sakta hai. Payment jaisi write mein duplicate ka risk hai, isliye stable idempotency key chahiye." },
    { when: "Backoff", what: "Attempts limit karo aur unke beech ka wait badhao, thodi variation ke saath, taaki clients ek hi pal par phir se na tootein. Kuch errors, jaise invalid input, retry karne layak nahi." },
    { when: "Circuit breaker", what: "Repeated failures ke baad breaker open hota hai, aur calls kuch der ke liye reject ya fallback par jaati hain. Wait ke baad ek limited test call dekhti hai ki service recover hui ya nahi." },
    { when: "Gracefully degrade", what: "Non-critical feature band ho toh core ko useful rakho: ‘temporarily unavailable’ placeholder, aur playback chalta rahe. Access check fail hona alag decision hai." },
    { when: "Redundancy, limits, observing", what: "Do servers ek ke fail hone ko cover kar sakte hain, par shared database phir bhi fail ho sakta hai. Rate limiting requests ko cap karta hai. Metrics, logs aur traces batate hain kya galat hai." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Timeout", what: "Response ke liye maximum wait. Iska matlab yeh nahi ki doosri side ne kuch nahi kiya.", example: "Thodi der baad recommendations ka intezaar chhod do" },
      { term: "Retry aur idempotency key", what: "Retry dobara try karta hai. Reads kuch cases mein retry ke liye safe ho sakti hain; payment jaisi write ko stable idempotency key chahiye taaki repeat se duplicate na ho.", example: "Read repeat karo, andha payment nahi" },
      { term: "Backoff", what: "Limited retries ke beech ka wait badhana, kuch variation ke saath.", example: "1s, phir 2s, phir 4s, thoda randomised" },
      { term: "Circuit breaker", what: "Repeated failures ke baad failing dependency ko kuch der ke liye call karna band karo, phir wait ke baad limited call se test karo.", example: "Open, test, recovery par phir close" },
      { term: "Graceful degradation", what: "Non-critical feature unavailable hone par bhi core experience ko useful rakhna.", example: "Placeholder cards, playback chalta rahe" },
      { term: "Rate limiting (token bucket)", what: "Policy jo limit karti hai ki ek client kitni requests kar sakta hai. Token bucket mein har request ek token leti hai aur tokens time ke saath refill hote hain.", example: "Bucket khaali: reject ya wait" },
    ],
  },

  concept: {
    cards: [{
      name: "Core ko bachao",
      examples: ["Playback aur required access checks", "Non-critical features ke liye placeholders"],
      moves: ["Features ko critical hone ke hisaab se rank karo", "Extras ko degrade karo, core ko nahi", "Access checks kabhi skip mat karo"],
    }, {
      name: "Dependency ko bachao",
      examples: ["Timeouts aur limited retries", "Backoff, circuit breaker, rate limiting"],
      moves: ["Hamesha wait mat karo", "Struggling service par load mat daalo", "Galat limit valid users ko bhi block kar sakti hai"],
    }],
    rule: "Reliability matlab failure ki umeed rakhna aur behaviour pehle se decide karna.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Kaunsi request aam taur par retry ke liye sabse safe hai?",
      choices: [
        { text: "Read request, kuch cases mein", why: "Sahi. Payment jaisi write mein duplicate ka risk hai aur stable idempotency key chahiye.", best: true },
        { text: "Payment, turant aur andhadhund", why: "Andha repeat effect ko duplicate kar sakta hai." },
        { text: "Invalid input wali koi bhi request", why: "Invalid input fail hota rahega, isliye retry karna bekaar hai." },
      ],
    },
    {
      id: "post-2",
      prompt: "Backoff kya hai?",
      choices: [
        { text: "Attempts ko limit karna aur unke beech ka wait thodi variation ke saath badhana", why: "Haan. Isse clients ek saath struggling service par nahi tootte.", best: true },
        { text: "Jitna ho sake tez retry karna", why: "Isse load badhta hai." },
        { text: "Kabhi dobara try na karna", why: "Yeh haar maanna hai, backoff nahi." },
      ],
    },
    {
      id: "post-3",
      prompt: "Open circuit breaker kya karta hai?",
      choices: [
        { text: "Failing dependency ko calls temporarily band karta hai, phir wait ke baad limited call se test karta hai", why: "Sahi. Resources bachte hain aur service ko recover hone ka mauka milta hai.", best: true },
        { text: "Failing service ko theek karta hai", why: "Woh failure ko cure nahi karta." },
        { text: "Sabko bina checks ke andar aane deta hai", why: "Iska isse koi lena-dena nahi." },
      ],
    },
    {
      id: "post-4",
      scenario: "Recommendations down hain, par playback chal raha hai.",
      prompt: "Yahan graceful degradation kya hai?",
      choices: [
        { text: "Recommendations ki jagah placeholder dikhao jabki playback chalta rahe", why: "Haan. Access check fail hona alag decision hai jo apne aap allow nahi hota.", best: true },
        { text: "Recommendations wapas aane tak stream rok do", why: "Isse chhota feature mukhya wale ko tod deta hai." },
        { text: "Match chalane ke liye access check skip kar do", why: "Access allow karna safe hai, yeh kabhi maan kar mat chalo." },
      ],
    },
    {
      id: "post-5",
      prompt: "Bahut kam set kiye gaye token bucket limit ka risk kya hai?",
      choices: [
        { text: "Valid users bhi block ho sakte hain", why: "Sahi. Limit asli use ke hisaab se honi chahiye.", best: true },
        { text: "Kuch nahi: kam hamesha safe hai", why: "Galat limit asli users ko nuksaan pahunchati hai." },
        { text: "Tokens kabhi refill nahi hote", why: "Design ke hisaab se woh time ke saath refill hote hain." },
      ],
    },
  ],

  build: {
    title: "Streaming app ko protect karo",
    intro: "Har protection ko us problem par drag karo jiska woh jawab hai. Ya ek tap karo, phir slot tap karo.",
    given: "Recommendations service slow hai",
    rows: [["timeout", "retry", "breaker"], ["degrade", "limit"]],
    rowLabels: ["Jab dependency slow ho", "Core rakho, load cap karo"],
    slots: {
      timeout: { role: "Slow service ke liye hamesha wait mat karo", answer: "timeout" },
      retry: { role: "Limited baar dobara try karo, badhte waits ke saath", answer: "retry" },
      breaker: { role: "Failing service ko kuch der call mat karo", answer: "breaker" },
      degrade: { role: "Playback chalte hue placeholder dikhao", answer: "degrade" },
      limit: { role: "Ek client kitni requests bhej sakta hai, cap karo", answer: "limit" },
    },
    chips: [
      { id: "limit", label: "Rate limiting", does: "ek client kitni requests kar sakta hai, token bucket jaise tareeke se cap karna" },
      { id: "spam", label: "Har error turant retry karo", does: "struggling service par load daalna, aur aise errors retry karna jo kabhi succeed nahi honge" },
      { id: "timeout", label: "Timeout", does: "response ke liye maximum wait set karna" },
      { id: "degrade", label: "Graceful degradation", does: "non-critical feature down hone par core ko useful rakhna" },
      { id: "breaker", label: "Circuit breaker", does: "failing dependency ko calls temporarily rokna" },
      { id: "retry", label: "Backoff ke saath retry", does: "limited attempts, badhte aur thode alag waits ke saath" },
    ],
    done: "Timeout, backoff ke saath limited retries, circuit breaker, graceful degradation aur rate limiting, har ek alag problem ka jawab.",
  },

  design: {
    title: "Recommendations service slow ho gayi",
    brief: "Interviewer poochta hai: “Agar recommendation service slow ho jaye toh streaming app ko kaise behave karna chahiye?” Apna answer likho: kya protect karoge, kya add karoge, aur kaise pata chalega.",
    constraints: [
      "Playback aur required access checks chalte rehne chahiye",
      "Slow service ko aur kharab mat karo",
      "Batao problem kaise notice karoge",
    ],
    minChars: 100,
    walkthrough: [
      { heading: "Ek possible answer", points: ["Calls par timeout lagao.", "Safe, limited retries backoff ke saath consider karo, aur repeated failures par circuit breaker.", "Recommendations ke liye placeholder dikhao; playback aur required access checks ko unki apni requirements se handle karo.", "Latency aur errors monitor karo."] },
      { heading: "Agar poochen kaise notice karoge", points: ["Metrics trend dikhate hain: error rate aur response time.", "Traces batate hain kaunsa hop slow hai; logs detail dete hain."] },
    ],
    checklist: [
      "Maine calls par timeout lagaya",
      "Maine backoff ke saath limited retries mention kiye",
      "Maine circuit breaker mention kiya",
      "Maine playback aur access checks ko recommendations se alag rakha",
      "Maine batayi ki monitoring kaise karoge",
    ],
  },

  followUps: [
    {
      q: "“Recommendation service slow ho jaye toh streaming app kaise behave karegi?”",
      answer: [
        "Calls par timeouts, safe aur limited retries backoff ke saath.",
        "Repeated failures ke baad circuit breaker.",
        "Recommendations ke liye placeholder; playback aur required access checks apni requirements se; aur latency aur errors ki monitoring.",
      ],
      say: "“Timeouts, limited retries, circuit breaker, recommendations ke liye placeholder, playback aur access checks apni shartein par, aur monitoring.”",
      deeper: "Days 11 aur 14",
    },
    {
      q: "“Payment call timeout ho gayi. Kya bas retry kar dein?”",
      answer: [
        "Timeout ka matlab fail hona nahi: woh complete ho chuki ho sakti hai aur response kho gaya ho.",
        "Payment ko andha retry karne se duplicate ka risk hai.",
        "Stable idempotency key use karo aur provider ka behaviour samjho.",
      ],
      say: "“Timeout ka matlab fail nahi. Main sirf stable idempotency key ke saath retry karunga, taaki repeat se do baar charge na ho.”",
      deeper: "Day 13",
    },
    {
      q: "“Kaise pata chalega ki kuch galat hai?”",
      answer: [
        "Metrics trends dikhate hain, jaise error rate aur response time.",
        "Traces ek request ka services ke beech journey dikhate hain, taaki slow hop mile.",
        "Logs individual events ki detail dete hain. Teeno saath use karo.",
      ],
      say: "“Metrics batate hain kab bigda, traces batate hain kaunsa hop slow hai, aur logs context dete hain.”",
    },
  ],

  faq: [
    { q: "Kya doosra server system ko reliable bana deta hai?", a: "Madad karta hai agar ek server fail ho aur capacity aur routing set ho. Par agar dono ek hi unavailable database par depend karein, toh database phir bhi failure point hai." },
    { q: "Kya failed access check par user ko andar aane dena chahiye?", a: "Nahi. Failure par apne aap access dena safe assumption nahi. Yeh decision security aur product requirements se aata hai." },
    { q: "Kya streaming app ek real design hai?", a: "Nahi. Yeh ek fictional teaching example hai." },
  ],

  interview: [
    "Features rank karo: kya critical hai aur kya degrade ho sakta hai.",
    "Timeouts, phir limited, safe retries backoff ke saath.",
    "Repeated failures ke liye circuit breaker.",
    "Graceful degradation, aur access checks ko alag rakho.",
    "Rate limiting, aur dekhne ke liye metrics, logs aur traces.",
  ],

  cheatsheet: {
    title: "Day 10 · Reliability aur overload",
    points: [
      "Har feature barabar critical nahi hota",
      "Timeout ka matlab yeh nahi ki doosri side ne kuch nahi kiya",
      "Limited retries backoff ke saath; writes ko idempotency key chahiye",
      "Circuit breaker failing service ko kuch der call karna rokta hai",
      "Gracefully degrade karo; required access checks kabhi skip mat karo",
      "Metrics, logs aur traces batate hain kya galat hai",
    ],
  },

  linkedin:
    "Day 10/21: System Design Essentials with Klymb.\n\nSlow recommendations service match ko nahi rokna chahiye. Rank karo kya critical hai; timeouts, backoff ke saath limited retries, circuit breaker, graceful degradation aur rate limiting use karo.\n\nAur yaad rakho: timeout ka matlab fail nahi, aur access checks ‘safe’ rehne ke liye kabhi skip nahi hote.\n\n#SystemDesign #Klymb",

  nextDay: "Day 11: notification system. Accepted, bheja gaya aur actually deliver hua, teen alag cheezein hain.",
};

export const essentialsDayTen: Day = {
  day: 10,
  of: 21,
  app: "A cricket streaming app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-10.mp4", poster: "/videos/system-design/essentials-day-10-poster.jpg", minutes: 5, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-10.mp4", poster: "/videos/system-design/essentials-day-10-poster.jpg" },
  },
};
