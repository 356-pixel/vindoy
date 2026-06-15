export type BlogPost = {
  id: string;
  category: string;
  title: string;
  excerpt: string;
  image: string;
  body: string;
};

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=800&q=70`;

export const BLOGS: BlogPost[] = [
  {
    id: "ai-everyday",
    category: "Artificial Intelligence",
    title: "How AI Is Quietly Reshaping Everyday Tools",
    excerpt:
      "From inbox triage to smarter search, AI is becoming invisible infrastructure inside the apps we already use.",
    image: img("photo-1677442136019-21780ecad995"),
    body:
      "AI features are moving from standalone products into the apps people already rely on. The biggest gains are not flashy chatbots but small, contextual assists: smarter autocomplete, automatic summaries, and intelligent defaults that save seconds many times a day.",
  },
  {
    id: "startup-mvp",
    category: "Startups",
    title: "Shipping an MVP Without Losing Your Weekends",
    excerpt:
      "A practical approach to scoping, building, and validating a first version that customers actually use.",
    image: img("photo-1556761175-5973dc0f32e7"),
    body:
      "The point of an MVP isn't to be small, it's to be falsifiable. Pick one job your product does better than the alternative, build only the surface area required to deliver it, and put it in front of real users within weeks, not quarters.",
  },
  {
    id: "finance-budget",
    category: "Personal Finance",
    title: "A Simple Budget That Actually Survives Real Life",
    excerpt:
      "Forget complicated spreadsheets. A flexible three-bucket system can keep your finances on track.",
    image: img("photo-1554224155-6726b3ff858f"),
    body:
      "Split take-home income into needs, wants, and future-you. The percentages matter less than the discipline of automating the transfers on payday so the decision is made once, not every month.",
  },
  {
    id: "remote-rituals",
    category: "Remote Work",
    title: "Remote Teams Run on Rituals, Not Tools",
    excerpt:
      "The best distributed teams obsess over async habits and documentation, not their software stack.",
    image: img("photo-1521737604893-d14cc237f11d"),
    body:
      "Tools come and go. What separates strong remote teams is shared rituals: written updates, decision logs, and clear ownership. Get those right and almost any toolset works.",
  },
  {
    id: "deep-work",
    category: "Productivity",
    title: "Protecting Deep Work in a World of Notifications",
    excerpt:
      "Small environmental changes outperform any productivity app for sustained focus.",
    image: img("photo-1499750310107-5fef28a66643"),
    body:
      "Deep work is a function of friction. Make distractions slightly harder to reach and meaningful work slightly easier to start, and your output compounds over weeks without any heroic willpower.",
  },
  {
    id: "climate-grid",
    category: "Climate Technology",
    title: "Why the Grid Is the Real Climate Story",
    excerpt:
      "Solar and wind get the headlines, but transmission and storage decide the pace of the energy transition.",
    image: img("photo-1466611653911-95081537e5b7"),
    body:
      "Clean generation is cheap and getting cheaper. The bottleneck is moving electrons from where they're produced to where they're used, on time. Expect the next decade of climate tech to be defined by transmission and storage.",
  },
  {
    id: "cyber-basics",
    category: "Cybersecurity",
    title: "The Five Security Habits That Cover 90% of Risk",
    excerpt:
      "Most breaches exploit the basics. A short checklist will protect you better than any expensive tool.",
    image: img("photo-1550751827-4bd374c3f58b"),
    body:
      "Use a password manager, turn on two-factor authentication, keep devices updated, back up important data, and pause before clicking unexpected links. That short list prevents the overwhelming majority of personal incidents.",
  },
  {
    id: "marketing-trust",
    category: "Marketing",
    title: "Trust Is the New Conversion Rate",
    excerpt:
      "As ad costs rise, brands that invest in credibility quietly outperform those chasing clicks.",
    image: img("photo-1460925895917-afdab827c52f"),
    body:
      "Reviews, case studies, and transparent pricing aren't just nice-to-haves. They are the highest-leverage growth investments most teams underspend on, especially as paid channels grow more expensive.",
  },
  {
    id: "health-sleep",
    category: "Health & Wellness",
    title: "Sleep Is the Cheapest Performance Upgrade",
    excerpt:
      "Before optimizing anything else, fix your sleep window. The compounding effects are enormous.",
    image: img("photo-1517248135467-4c7edcad34c4"),
    body:
      "A consistent sleep schedule, a cool dark room, and a screen-free buffer at night will outperform almost any supplement or productivity hack. It is the boring foundation everything else builds on.",
  },
  {
    id: "learning-loop",
    category: "Learning & Education",
    title: "Learn Faster by Closing the Feedback Loop",
    excerpt:
      "Practice without feedback plateaus quickly. Build in tests, peers, and reflection from day one.",
    image: img("photo-1503676260728-1c00da094a0b"),
    body:
      "The fastest learners aren't necessarily smarter. They get feedback sooner and more often. Whenever you start something new, design how you'll know you're improving before you design how you'll practice.",
  },
];
