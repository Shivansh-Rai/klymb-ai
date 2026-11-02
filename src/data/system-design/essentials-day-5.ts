/**
 * Day 5 of "System Design Essentials": where the shop's data lives, and how it
 * is organised and found. Built from the Day 5 video script. The shop, its
 * tables and its prices are fictional teaching examples.
 */

import type { Day, DayCopy } from "./types";

const en: DayCopy = {
  tag: "Day 5 · Database foundations",
  hookLines: [
    "A shopper views product 123, adds it to the cart, and orders it.",
    "Later they open their order history.",
    "What does the database have to remember?",
  ],
  question: "Pause and think: what information must we store, and how will we find it again?",

  pre: [
    {
      id: "pre-1",
      scenario: "Running shoes were listed at ₹2,499 when a shopper bought them. Tomorrow the listed price changes to ₹2,999.",
      prompt: "Should the old order now show ₹2,999?",
      choices: [
        { text: "No: the order item keeps the price agreed at purchase", why: "Right. Storing the purchase-time price keeps the order’s history correct when today’s price changes.", best: true },
        { text: "Yes: it should always follow the listed price", why: "Then every old order would silently change what the customer paid." },
        { text: "It depends on the colour of the shoe", why: "The price history has nothing to do with the colour." },
      ],
    },
    {
      id: "pre-2",
      scenario: "“Show a user’s recent orders” is slow. A teammate says: put an index on every column.",
      prompt: "Is that a good idea?",
      choices: [
        { text: "No: indexes help some reads but cost storage and extra work on every write, so look at the real query and measure", why: "Yes. An index isn’t free, and indexing everything isn’t automatically best.", best: true },
        { text: "Yes: indexes make everything faster with no downside", why: "They take storage and must be updated when the data changes." },
        { text: "No: indexes never help", why: "They can make certain lookups much more efficient." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Saving an order works, but saving its items fails.",
      prompt: "What’s the risk?",
      choices: [
        { text: "An incomplete order: the order exists but its items don’t", why: "Right. That’s what a database transaction helps with: related writes succeed together or are rolled back together.", best: true },
        { text: "Nothing: the items can be added whenever", why: "A half-saved order is a real problem for the customer and the shop." },
        { text: "The database deletes itself", why: "No. The risk is inconsistent data." },
      ],
    },
  ],

  revealTitle: "Organising the shop’s data",
  revealSub: "a fictional shop, a simplified model",
  reveal: [
    { when: "Tables, rows, columns", what: "A relational database organises data in tables. Columns say what information there is; each row is one record, like product 123 with its name and price." },
    { when: "Primary key", what: "The field or fields that uniquely identify each row, like the product ID." },
    { when: "Four tables", what: "Users, Products, Orders and Order Items. Orders carry a user ID; Order Items say which product and how many are in which order. IDs relate the records." },
    { when: "Price at purchase", what: "The order item stores the agreed price, so changing today’s listed price doesn’t rewrite history. A model decides what the system remembers." },
    { when: "Access pattern and index", what: "“Recent orders for user 42” is an access pattern. An index on user ID and order time can make it efficient, at the cost of storage and extra work on writes." },
    { when: "Transaction", what: "Within one database, the order and its items can commit together, or roll back together. The external payment provider isn’t automatically part of it." },
  ],

  explain: {
    title: "The words from today",
    items: [
      { term: "Table, row, column", what: "A table is a structured list. Columns say which information there is, and each row is one record.", example: "Products: product_id, name, price" },
      { term: "Primary key", what: "The field or fields chosen to uniquely identify each row in a table.", example: "product_id" },
      { term: "Relating records", what: "IDs connect records in different tables.", example: "Orders.user_id, OrderItems.order_id and product_id" },
      { term: "Access pattern", what: "How the application will read or find the data.", example: "A user’s recent orders" },
      { term: "Index", what: "An extra structure that can make some lookups efficient, like a book’s index. It costs storage and must be maintained when data changes.", example: "An index on user ID and order time" },
      { term: "Transaction", what: "A way to treat related operations as one group: commit together, or roll back together. Supported inside one database.", example: "Create the order and its items" },
    ],
  },

  concept: {
    cards: [{
      name: "What an index gives",
      examples: ["Faster, more efficient lookups", "Recent orders for one user"],
      moves: ["Helps certain reads", "Needs the right fields", "Worth checking against real queries"],
    }, {
      name: "What an index costs",
      examples: ["Extra storage", "Extra work whenever the data changes"],
      moves: ["Not free", "Not “index every field”", "Measure before adding"],
    }],
    rule: "A data model isn’t only a list of fields: it decides what the system remembers and how it finds it.",
  },

  post: [
    {
      id: "post-1",
      prompt: "What is a primary key?",
      choices: [
        { text: "The field or fields chosen to uniquely identify each row in a table", why: "Yes, like the product ID.", best: true },
        { text: "The most important column in the table", why: "It isn’t about importance: it’s about uniquely identifying a row." },
        { text: "A password for the database", why: "It has nothing to do with access." },
      ],
    },
    {
      id: "post-2",
      prompt: "Which table says which product, and how many, are in an order?",
      choices: [
        { text: "Order Items", why: "Yes: each row ties an order to a product, a quantity and the price paid.", best: true },
        { text: "Users", why: "Users says who the shopper is." },
        { text: "Products", why: "Products holds what’s listed and its current price." },
      ],
    },
    {
      id: "post-3",
      prompt: "What is the trade-off of adding an index?",
      choices: [
        { text: "It can make some lookups efficient, but takes storage and must be maintained when data changes", why: "Right: benefit and cost together.", best: true },
        { text: "It makes writes faster", why: "It usually adds work to writes, not removes it." },
        { text: "It has no cost, so every field should have one", why: "Indexing everything isn’t automatically best." },
      ],
    },
    {
      id: "post-4",
      scenario: "An order and its items are saved inside a database transaction. The order also involves an external payment provider.",
      prompt: "Which statement is true?",
      choices: [
        { text: "The order and items commit or roll back together, but the payment provider isn’t automatically part of that transaction", why: "Right. Payment coordination and failure handling are a separate design problem.", best: true },
        { text: "The payment is automatically inside the transaction", why: "Drawing it inside a box doesn’t make it so." },
        { text: "Transactions make failures impossible", why: "They help keep related writes consistent, nothing more." },
      ],
    },
    {
      id: "post-5",
      prompt: "An interviewer asks: “SQL or NoSQL?” What’s a good start?",
      choices: [
        { text: "Ask how the data is read and updated, what relationships and transactions are needed, and the scale and operations", why: "Yes. Features differ between products, so no single label decides it.", best: true },
        { text: "“It’s a shopping app, so always SQL”", why: "A blanket rule like that is misleading." },
        { text: "“NoSQL never has transactions”", why: "Capabilities differ between products, so that claim is too absolute." },
      ],
    },
  ],

  build: {
    title: "Organise the shop’s data",
    intro: "Drag each table to the job it does. You can also tap a table, then tap a slot.",
    given: "Users, products and orders",
    rows: [["users", "products"], ["orders", "items"]],
    slots: {
      users: { role: "Who the shopper is", answer: "users" },
      products: { role: "What’s listed, with today’s name and price", answer: "products" },
      orders: { role: "Which user placed an order, and when", answer: "orders" },
      items: { role: "Which product, how many, and the price paid", answer: "items" },
    },
    chips: [
      { id: "items", label: "Order Items", does: "tying an order to a product, a quantity and the price at purchase" },
      { id: "one", label: "One giant table with everything", does: "mixing every record into one table, which makes relating and finding records harder" },
      { id: "users", label: "Users", does: "keeping who each shopper is" },
      { id: "orders", label: "Orders", does: "recording that a user placed an order, with its time" },
      { id: "products", label: "Products", does: "listing products with their current name and price" },
    ],
    done: "Four tables related by IDs: orders point to users, and order items point to orders and products.",
  },

  design: {
    title: "Model orders and find the recent ones",
    brief: "An interviewer asks: “How would you store a user’s order history and retrieve it?” Describe your tables and how you’d find a user’s recent orders. Include where you’d keep the price paid.",
    constraints: [
      "Users, orders and order items",
      "Relate records with IDs",
      "Find a user’s recent orders efficiently",
      "Keep the price paid at purchase",
    ],
    minChars: 100,
    walkthrough: [
      { heading: "One possible answer", points: ["Relate users, orders and order items with IDs.", "The access pattern is recent orders for a user, so evaluate an index on user ID and order time.", "Store the purchase-time price on the order item.", "Use a database transaction for related local writes."] },
      { heading: "If asked: index everything?", points: ["No. An index helps reads but costs storage and write maintenance.", "Look at the real queries and measure."] },
    ],
    checklist: [
      "I related users, orders and items with IDs",
      "I named the access pattern for recent orders",
      "I mentioned an index and its cost",
      "I kept the price paid on the order item",
      "I used a transaction for related writes",
    ],
  },

  followUps: [
    {
      q: "“How would you store and retrieve a user’s order history?”",
      answer: [
        "Relate users, orders and order items with IDs.",
        "The access pattern is a user’s recent orders, so evaluate an index on user ID and order time.",
        "Keep the purchase-time price on the order item, and use a transaction for the related writes.",
      ],
      say: "“I’d relate records by IDs, evaluate an index on user ID and order time for recent orders, keep the purchase price on order items, and use a transaction for related writes.”",
      deeper: "Days 7 and 13",
    },
    {
      q: "“Why not put an index on every field?”",
      answer: [
        "An index can help reads, but it takes storage.",
        "It has to be updated whenever the data changes, so it adds work to writes.",
        "Look at the actual queries and measure.",
      ],
      say: "“Indexes help some reads but cost storage and write maintenance, so I’d index for the real queries and measure.”",
    },
    {
      q: "“SQL or NoSQL for this shop?”",
      answer: [
        "Ask how the data is read and updated, what relationships and transactions are needed, and the scale and team needs.",
        "NoSQL is a broad category, with document and key-value models, and capabilities differ between products.",
        "Avoid blanket claims either way.",
      ],
      say: "“It depends on access patterns, relationships, transactions and scale. I wouldn’t decide from the label alone.”",
      deeper: "Day 7",
    },
  ],

  faq: [
    { q: "Do I have to use exactly these four tables?", a: "No. They’re a simple example. You model the data around your own requirements." },
    { q: "Does a transaction cover the payment too?", a: "Not automatically. A transaction groups operations inside one supported database. A separate payment provider needs its own coordination and failure handling." },
    { q: "Are the prices real?", a: "No. The shop, its tables and its prices are fictional teaching examples." },
  ],

  interview: [
    "Relate users, orders and order items with IDs.",
    "Name the access pattern, then evaluate an index for it.",
    "Say what an index costs: storage and write work.",
    "Keep the purchase-time price on the order item.",
    "For SQL vs NoSQL, talk about access patterns, relationships, transactions and scale.",
  ],

  cheatsheet: {
    title: "Day 5 · Database foundations",
    points: [
      "Tables hold rows; columns say what information there is",
      "A primary key uniquely identifies each row",
      "Relate records with IDs: orders to users, items to orders and products",
      "Store the price paid on the order item",
      "An index speeds some lookups but costs storage and write work",
      "A transaction commits related writes together; payment is separate",
    ],
  },

  linkedin:
    "Day 5/21 of System Design Essentials with Klymb.\n\nInside the database: tables, rows and primary keys, records related by IDs, and the price paid kept on the order item so history stays true when today’s price changes.\n\nAn index helps some lookups but costs storage and write work, and a transaction keeps related writes together. The payment provider is a separate problem.\n\n#SystemDesign #Klymb",

  nextDay: "Day 6: thousands of shoppers ask for the same product again and again. Should the database do the same work every time?",
};

const hi: DayCopy = {
  tag: "Day 5 · Database foundations",
  hookLines: [
    "Ek shopper product 123 dekhta hai, cart mein dalta hai, aur order karta hai.",
    "Baad mein woh apni order history kholta hai.",
    "Database ko kya yaad rakhna padega?",
  ],
  question: "Pause karke socho: hume kaunsi information store karni hogi, aur use wapas kaise dhoondhenge?",

  pre: [
    {
      id: "pre-1",
      scenario: "Running shoes ₹2,499 par listed the jab shopper ne khareede. Kal listed price ₹2,999 ho jaata hai.",
      prompt: "Kya purane order mein ab ₹2,999 dikhna chahiye?",
      choices: [
        { text: "Nahi: order item purchase ke waqt agreed price rakhta hai", why: "Sahi. Purchase-time price store karne se aaj ka price badalne par bhi order ki history sahi rehti hai.", best: true },
        { text: "Haan: woh hamesha listed price ko follow kare", why: "Tab har purana order chupke se badal dega ki customer ne kitna diya." },
        { text: "Yeh shoe ke colour par depend karta hai", why: "Price history ka colour se koi lena-dena nahi." },
      ],
    },
    {
      id: "pre-2",
      scenario: "“User ke recent orders dikhao” slow hai. Ek teammate kehta hai: har column par index laga do.",
      prompt: "Kya yeh achha idea hai?",
      choices: [
        { text: "Nahi: index kuch reads mein madad karte hain par storage aur har write par extra kaam lete hain, isliye real query dekho aur measure karo", why: "Haan. Index free nahi hai, aur sab kuch index karna automatically best nahi.", best: true },
        { text: "Haan: index se sab kuch tez ho jaata hai, koi nuksaan nahi", why: "Woh storage lete hain aur data badalne par update karne padte hain." },
        { text: "Nahi: index kabhi madad nahi karte", why: "Woh kuch lookups ko bahut efficient bana sakte hain." },
      ],
    },
    {
      id: "pre-3",
      scenario: "Order save ho jaata hai, par uske items save fail ho jaate hain.",
      prompt: "Risk kya hai?",
      choices: [
        { text: "Incomplete order: order hai par uske items nahi", why: "Sahi. Isi mein database transaction madad karta hai: related writes saath mein succeed hon ya saath mein rollback.", best: true },
        { text: "Kuch nahi: items kabhi bhi add ho sakte hain", why: "Aadha save hua order customer aur shop dono ke liye asli problem hai." },
        { text: "Database khud delete ho jaata hai", why: "Nahi. Risk inconsistent data ka hai." },
      ],
    },
  ],

  revealTitle: "Shop ka data organise karna",
  revealSub: "ek fictional shop, simplified model",
  reveal: [
    { when: "Tables, rows, columns", what: "Relational database data ko tables mein organise karta hai. Columns batate hain kaunsi information hai; har row ek record hai, jaise product 123 apne name aur price ke saath." },
    { when: "Primary key", what: "Woh field ya fields jo har row ko uniquely identify karte hain, jaise product ID." },
    { when: "Chaar tables", what: "Users, Products, Orders aur Order Items. Orders mein user ID hoti hai; Order Items batate hain kis order mein kaunsa product aur kitne hain. IDs records ko relate karti hain." },
    { when: "Purchase ka price", what: "Order item agreed price store karta hai, isliye aaj ka listed price badalne se history nahi badalti. Model decide karta hai system kya yaad rakhega." },
    { when: "Access pattern aur index", what: "“User 42 ke recent orders” ek access pattern hai. User ID aur order time par index use efficient bana sakta hai, storage aur writes par extra kaam ki keemat par." },
    { when: "Transaction", what: "Ek database ke andar order aur uske items saath mein commit ho sakte hain, ya saath mein rollback. External payment provider apne aap uska hissa nahi hota." },
  ],

  explain: {
    title: "Aaj ke words",
    items: [
      { term: "Table, row, column", what: "Table ek structured list hai. Columns batate hain kaunsi information hai, aur har row ek record hai.", example: "Products: product_id, name, price" },
      { term: "Primary key", what: "Woh field ya fields jo table ki har row ko uniquely identify karne ke liye chune jaate hain.", example: "product_id" },
      { term: "Records ko relate karna", what: "IDs alag tables ke records ko jodti hain.", example: "Orders.user_id, OrderItems.order_id aur product_id" },
      { term: "Access pattern", what: "Application data ko kaise padhegi ya dhoondhegi.", example: "User ke recent orders" },
      { term: "Index", what: "Ek extra structure jo kuch lookups efficient bana sakta hai, jaise book ka index. Storage leta hai aur data badalne par maintain karna padta hai.", example: "User ID aur order time par index" },
      { term: "Transaction", what: "Related operations ko ek group ki tarah handle karne ka tareeka: saath mein commit, ya saath mein rollback. Ek supported database ke andar.", example: "Order aur uske items banana" },
    ],
  },

  concept: {
    cards: [{
      name: "Index kya deta hai",
      examples: ["Tez, efficient lookups", "Ek user ke recent orders"],
      moves: ["Kuch reads mein madad", "Sahi fields chahiye", "Real queries se check karna chahiye"],
    }, {
      name: "Index kya leta hai",
      examples: ["Extra storage", "Data badalte waqt extra kaam"],
      moves: ["Free nahi", "“Har field index karo” nahi", "Lagane se pehle measure karo"],
    }],
    rule: "Data model sirf fields ki list nahi: woh decide karta hai system kya yaad rakhega aur use kaise dhoondhega.",
  },

  post: [
    {
      id: "post-1",
      prompt: "Primary key kya hai?",
      choices: [
        { text: "Woh field ya fields jo table ki har row ko uniquely identify karne ke liye chune jaate hain", why: "Haan, jaise product ID.", best: true },
        { text: "Table ka sabse important column", why: "Baat importance ki nahi: row ko uniquely identify karne ki hai." },
        { text: "Database ka password", why: "Iska access se koi lena-dena nahi." },
      ],
    },
    {
      id: "post-2",
      prompt: "Kaunsi table batati hai ki order mein kaunsa product aur kitne hain?",
      choices: [
        { text: "Order Items", why: "Haan: har row ek order ko product, quantity aur diye gaye price se jodti hai.", best: true },
        { text: "Users", why: "Users batati hai shopper kaun hai." },
        { text: "Products", why: "Products mein jo listed hai aur uska current price hota hai." },
      ],
    },
    {
      id: "post-3",
      prompt: "Index add karne ka trade-off kya hai?",
      choices: [
        { text: "Kuch lookups efficient ho sakte hain, par storage lagta hai aur data badalne par maintain karna padta hai", why: "Sahi: fayda aur cost saath mein.", best: true },
        { text: "Isse writes tez ho jaate hain", why: "Aam taur par writes mein kaam badhta hai, ghatta nahi." },
        { text: "Koi cost nahi, isliye har field par lagao", why: "Sab kuch index karna automatically best nahi." },
      ],
    },
    {
      id: "post-4",
      scenario: "Order aur uske items database transaction ke andar save hote hain. Order mein ek external payment provider bhi hai.",
      prompt: "Kaunsa statement sahi hai?",
      choices: [
        { text: "Order aur items saath mein commit ya rollback hote hain, par payment provider apne aap us transaction ka hissa nahi", why: "Sahi. Payment coordination aur failure handling alag design problem hai.", best: true },
        { text: "Payment apne aap transaction ke andar hai", why: "Box ke andar draw kar dene se woh ban nahi jaata." },
        { text: "Transactions se failures impossible ho jaate hain", why: "Woh related writes ko consistent rakhne mein madad karte hain, bas." },
      ],
    },
    {
      id: "post-5",
      prompt: "Interviewer poochta hai: “SQL ya NoSQL?” Achha start kya hai?",
      choices: [
        { text: "Poochho data kaise read aur update hoga, kaunse relationships aur transactions chahiye, aur scale aur operations kya hain", why: "Haan. Products mein features alag hote hain, isliye ek label se decide nahi hota.", best: true },
        { text: "“Shopping app hai, toh hamesha SQL”", why: "Aisa blanket rule misleading hai." },
        { text: "“NoSQL mein transactions kabhi nahi hote”", why: "Capabilities products ke hisaab se alag hoti hain, isliye yeh claim bahut absolute hai." },
      ],
    },
  ],

  build: {
    title: "Shop ka data organise karo",
    intro: "Har table ko uske kaam par drag karo. Ya table tap karo, phir slot tap karo.",
    given: "Users, products aur orders",
    rows: [["users", "products"], ["orders", "items"]],
    slots: {
      users: { role: "Shopper kaun hai", answer: "users" },
      products: { role: "Kya listed hai, aaj ke name aur price ke saath", answer: "products" },
      orders: { role: "Kis user ne kab order kiya", answer: "orders" },
      items: { role: "Kaunsa product, kitne, aur diya gaya price", answer: "items" },
    },
    chips: [
      { id: "items", label: "Order Items", does: "order ko product, quantity aur purchase ke price se jodna" },
      { id: "one", label: "Ek bada table jismein sab kuch", does: "har record ko ek table mein mila dena, jisse records ko relate aur dhoondhna mushkil hota hai" },
      { id: "users", label: "Users", does: "har shopper kaun hai, yeh rakhna" },
      { id: "orders", label: "Orders", does: "record karna ki user ne order kiya, uske time ke saath" },
      { id: "products", label: "Products", does: "products ko unke current name aur price ke saath list karna" },
    ],
    done: "Chaar tables IDs se related: orders users ko point karte hain, aur order items orders aur products ko.",
  },

  design: {
    title: "Orders model karo aur recent wale dhoondo",
    brief: "Interviewer poochta hai: “User ki order history ko kaise store aur retrieve karoge?” Apne tables batao aur yeh ki user ke recent orders kaise dhoondhoge. Batao diya gaya price kahan rakhoge.",
    constraints: [
      "Users, orders aur order items",
      "Records ko IDs se relate karo",
      "User ke recent orders efficiently dhoondo",
      "Purchase ke waqt ka price rakho",
    ],
    minChars: 100,
    walkthrough: [
      { heading: "Ek possible answer", points: ["Users, orders aur order items ko IDs se relate karo.", "Access pattern user ke recent orders hai, isliye user ID aur order time par index evaluate karo.", "Purchase-time price order item par store karo.", "Related local writes ke liye database transaction use karo."] },
      { heading: "Agar poochen: sab par index?", points: ["Nahi. Index reads mein madad karta hai par storage aur write maintenance leta hai.", "Real queries dekho aur measure karo."] },
    ],
    checklist: [
      "Maine users, orders aur items ko IDs se relate kiya",
      "Maine recent orders ka access pattern bataya",
      "Maine index aur uski cost mention ki",
      "Maine diya gaya price order item par rakha",
      "Maine related writes ke liye transaction use kiya",
    ],
  },

  followUps: [
    {
      q: "“User ki order history ko kaise store aur retrieve karoge?”",
      answer: [
        "Users, orders aur order items ko IDs se relate karo.",
        "Access pattern user ke recent orders hai, isliye user ID aur order time par index evaluate karo.",
        "Purchase-time price order item par rakho, aur related writes ke liye transaction use karo.",
      ],
      say: "“Main records ko IDs se relate karunga, recent orders ke liye user ID aur order time par index evaluate karunga, purchase price order items par rakhunga, aur related writes ke liye transaction use karunga.”",
      deeper: "Days 7 aur 13",
    },
    {
      q: "“Har field par index kyun nahi laga dete?”",
      answer: [
        "Index reads mein madad kar sakta hai, par storage leta hai.",
        "Data badalne par use update karna padta hai, isliye writes mein kaam badhta hai.",
        "Asli queries dekho aur measure karo.",
      ],
      say: "“Index kuch reads mein madad karte hain par storage aur write maintenance lete hain, isliye main real queries ke liye index karunga aur measure karunga.”",
    },
    {
      q: "“Is shop ke liye SQL ya NoSQL?”",
      answer: [
        "Poochho data kaise read aur update hoga, kaunse relationships aur transactions chahiye, aur scale aur team needs kya hain.",
        "NoSQL ek broad category hai, document aur key-value models ke saath, aur products mein capabilities alag hoti hain.",
        "Dono taraf blanket claims se bachho.",
      ],
      say: "“Yeh access patterns, relationships, transactions aur scale par depend karta hai. Sirf label se decide nahi karunga.”",
      deeper: "Day 7",
    },
  ],

  faq: [
    { q: "Kya exactly yahi chaar tables use karni hain?", a: "Nahi. Yeh ek simple example hai. Aap data ko apni requirements ke hisaab se model karte ho." },
    { q: "Kya transaction payment ko bhi cover karta hai?", a: "Apne aap nahi. Transaction ek supported database ke andar operations ko group karta hai. Alag payment provider ko apni coordination aur failure handling chahiye." },
    { q: "Kya prices asli hain?", a: "Nahi. Shop, uske tables aur prices fictional teaching examples hain." },
  ],

  interview: [
    "Users, orders aur order items ko IDs se relate karo.",
    "Access pattern batao, phir uske liye index evaluate karo.",
    "Batao index ki cost kya hai: storage aur write ka kaam.",
    "Purchase-time price order item par rakho.",
    "SQL vs NoSQL mein access patterns, relationships, transactions aur scale ki baat karo.",
  ],

  cheatsheet: {
    title: "Day 5 · Database foundations",
    points: [
      "Tables mein rows hoti hain; columns batate hain kaunsi information hai",
      "Primary key har row ko uniquely identify karti hai",
      "IDs se records relate karo: orders users se, items orders aur products se",
      "Diya gaya price order item par store karo",
      "Index kuch lookups tez karta hai par storage aur write ka kaam leta hai",
      "Transaction related writes ko saath commit karta hai; payment alag hai",
    ],
  },

  linkedin:
    "Day 5/21: System Design Essentials with Klymb.\n\nDatabase ke andar: tables, rows aur primary keys, IDs se related records, aur diya gaya price order item par, taaki aaj ka price badalne par bhi history sahi rahe.\n\nIndex kuch lookups mein madad karta hai par storage aur write ka kaam leta hai, aur transaction related writes ko saath rakhta hai. Payment provider alag problem hai.\n\n#SystemDesign #Klymb",

  nextDay: "Day 6: hazaaron shopper baar-baar wahi product maangte hain. Kya database ko har baar wahi kaam karna chahiye?",
};

export const essentialsDayFive: Day = {
  day: 5,
  of: 21,
  app: "A shopping app",
  minutes: 18,
  hook: { date: "Fictional example" },
  copy: { en, hi },
  sources: [],
  video: {
    src: "/api/video/essentials-day-5.mp4", poster: "/videos/system-design/essentials-day-5-poster.jpg", minutes: 6, lang: "Hinglish",
    // One horizontal cut with the captions burned in: it plays in the wide frame, and with no caption lines there's no subtitle switch.
    wide: { src: "/api/video/essentials-day-5.mp4", poster: "/videos/system-design/essentials-day-5-poster.jpg" },
  },
};
