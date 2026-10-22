import type { Course, Lesson, Review } from "./types";

const videos = [
  "zJSY8tbf_ys",
  "rfscVS0vtbw",
  "qiQR5rTSshw",
  "inWWhr5tnEA",
  "HXV3zeQKqGY",
  "c9Wg6Cb_YlU",
  "P6rEeX4E8xw",
  "nU-IIXBWlS4",
];

type FixtureCourse = Omit<Course, "lessonsCount" | "studentsCount"> & {
  lessonTitles: string[];
};

const rawCourses: FixtureCourse[] = [
  {
    id: "course-full-stack",
    slug: "full-stack-web-development",
    title: "Full-Stack Web Development",
    category: "Programming",
    level: "Beginner",
    priceKobo: 4_500_000,
    hours: 38,
    rating: 4.8,
    emoji: "💻",
    gradient: "#0a84ff,#5e5ce6",
    published: true,
    description:
      "Go from your first line of HTML to deploying production-ready apps with React, Node.js, databases and authentication. Build a portfolio project that employers actually want to see.",
    outcomes: [
      "Build responsive interfaces with HTML, CSS and modern JavaScript",
      "Create full-stack apps with React, Next.js and Node APIs",
      "Model data and write queries with PostgreSQL",
      "Deploy, secure and maintain a live application",
    ],
    lessonTitles: [
      "Welcome, roadmap and how to learn faster",
      "HTML structure and semantic markup",
      "CSS layout: flexbox, grid and responsive design",
      "JavaScript fundamentals and the DOM",
      "React components, props and state",
      "Building APIs with Node.js and Next.js",
      "Databases, authentication and security basics",
      "Capstone project: build and deploy your app",
    ],
  },
  {
    id: "course-python",
    slug: "python-for-everyone",
    title: "Python for Everyone",
    category: "Programming",
    level: "Beginner",
    priceKobo: 2_500_000,
    hours: 22,
    rating: 4.7,
    emoji: "🐍",
    gradient: "#30d158,#0a84ff",
    published: true,
    description:
      "Learn programming the practical way with Python. Automate boring tasks, work with data, and build small tools you can use immediately — no prior experience required.",
    outcomes: [
      "Understand variables, loops, functions and data structures",
      "Read and write files, APIs and spreadsheets with Python",
      "Automate repetitive tasks with scripts",
      "Build a command-line project from scratch",
    ],
    lessonTitles: [
      "Python setup and your first program",
      "Variables, types and user input",
      "Conditionals, loops and logic",
      "Functions, modules and clean code",
      "Lists, dictionaries and data structures",
      "Files, errors and automation",
      "Working with APIs and JSON",
      "Capstone: build an automation tool",
    ],
  },
  {
    id: "course-networking",
    slug: "networking-cctv-installation",
    title: "Networking & CCTV Installation",
    category: "Networking",
    level: "Intermediate",
    priceKobo: 3_500_000,
    hours: 20,
    rating: 4.6,
    emoji: "📡",
    gradient: "#ff9f0a,#ff375f",
    published: true,
    description:
      "A hands-on guide to modern networking and CCTV systems: IP addressing, routers, switches, cabling, NVR configuration and commissioning. Ideal for technicians and installers.",
    outcomes: [
      "Design and troubleshoot small business networks",
      "Configure routers, switches and Wi-Fi securely",
      "Install and configure IP cameras and NVRs",
      "Commission and document a CCTV deployment",
    ],
    lessonTitles: [
      "Networking foundations and topologies",
      "IP addressing, subnets and DHCP",
      "Routers, switches and access points",
      "Cabling, crimping and testing",
      "CCTV system components and planning",
      "IP cameras, NVR setup and storage",
      "Remote access and network security",
      "Site survey and commissioning project",
    ],
  },
  {
    id: "course-security",
    slug: "cybersecurity-essentials",
    title: "Cybersecurity Essentials",
    category: "Security",
    level: "Intermediate",
    priceKobo: 4_000_000,
    hours: 28,
    rating: 4.9,
    emoji: "🛡️",
    gradient: "#5e5ce6,#bf5af2",
    published: true,
    description:
      "Understand how attackers think and how to stop them. Covers threat models, network defence, web security, identity, and the practical habits that protect real organisations.",
    outcomes: [
      "Identify common threats and attack surfaces",
      "Harden networks, endpoints and accounts",
      "Understand web vulnerabilities such as XSS and SQL injection",
      "Respond to incidents and document findings",
    ],
    lessonTitles: [
      "The security mindset and threat modelling",
      "Passwords, MFA and identity hygiene",
      "Network attacks, firewalls and VPNs",
      "Malware, phishing and social engineering",
      "Web application security fundamentals",
      "Securing cloud and remote work",
      "Incident response and forensics basics",
      "Capstone: secure a small business",
    ],
  },
  {
    id: "course-data",
    slug: "data-analysis-excel-sql",
    title: "Data Analysis with Excel & SQL",
    category: "Data",
    level: "Beginner",
    priceKobo: 2_000_000,
    hours: 16,
    rating: 4.5,
    emoji: "📊",
    gradient: "#64d2ff,#30d158",
    published: true,
    description:
      "Turn raw numbers into decisions. Master spreadsheets, pivot tables, charts and SQL queries, then build a dashboard you can show to employers or clients.",
    outcomes: [
      "Clean and structure messy datasets",
      "Use formulas, pivot tables and charts confidently",
      "Write SQL to filter, join and aggregate data",
      "Build an interactive dashboard for a real scenario",
    ],
    lessonTitles: [
      "Spreadsheet essentials and shortcuts",
      "Data cleaning and validation",
      "Formulas that do the heavy lifting",
      "Pivot tables and summaries",
      "Charts and visual storytelling",
      "SQL basics: select, filter, sort",
      "Joins, grouping and subqueries",
      "Capstone: sales performance dashboard",
    ],
  },
  {
    id: "course-design",
    slug: "ui-ux-design-masterclass",
    title: "UI/UX Design Masterclass",
    category: "Design",
    level: "Beginner",
    priceKobo: 3_000_000,
    hours: 24,
    rating: 4.8,
    emoji: "🎨",
    gradient: "#ff375f,#bf5af2",
    published: true,
    description:
      "Design digital products people love to use. Learn research, wireframing, design systems and prototyping in Figma while building a portfolio-ready case study.",
    outcomes: [
      "Run user research and turn insights into designs",
      "Wireframe, prototype and test in Figma",
      "Build accessible, consistent design systems",
      "Present a complete UX case study",
    ],
    lessonTitles: [
      "What UX really means and where to start",
      "User research, interviews and personas",
      "Information architecture and user flows",
      "Wireframes, layouts and grids",
      "Visual design: type, colour and spacing",
      "Design systems and reusable components",
      "Prototyping and usability testing",
      "Capstone: end-to-end product case study",
    ],
  },
  {
    id: "course-hardware",
    slug: "computer-repair-maintenance",
    title: "Computer Repair & Maintenance",
    category: "Hardware",
    level: "Beginner",
    priceKobo: 1_800_000,
    hours: 14,
    rating: 4.4,
    emoji: "🖥️",
    gradient: "#8e8e93,#0a84ff",
    published: true,
    description:
      "Diagnose, fix and maintain desktops and laptops with confidence. Covers components, assembly, operating system installation, troubleshooting and preventive maintenance.",
    outcomes: [
      "Identify components and assemble a PC safely",
      "Diagnose hardware and software faults",
      "Install and configure operating systems",
      "Set up a preventative maintenance routine",
    ],
    lessonTitles: [
      "Tools, safety and workspace setup",
      "Inside a computer: components explained",
      "PC assembly and BIOS configuration",
      "Operating system installation and drivers",
      "Diagnosing boot and performance issues",
      "Laptop teardown and upgrade paths",
      "Data backup, recovery and malware cleanup",
      "Capstone: full repair and handover",
    ],
  },
  {
    id: "course-marketing",
    slug: "digital-marketing-freelancing",
    title: "Digital Marketing & Freelancing",
    category: "Business",
    level: "Beginner",
    priceKobo: 2_200_000,
    hours: 18,
    rating: 4.6,
    emoji: "🚀",
    gradient: "#ff9f0a,#ffd60a",
    published: true,
    description:
      "Learn to attract customers online and turn those skills into income. Social media, SEO, content, ads and client acquisition — built for the Nigerian market.",
    outcomes: [
      "Build a practical marketing strategy",
      "Create content and run social media campaigns",
      "Understand SEO, landing pages and paid ads",
      "Package your services and win freelance clients",
    ],
    lessonTitles: [
      "Digital marketing landscape and opportunities",
      "Finding your niche and ideal customer",
      "Content strategy and social media",
      "SEO, websites and landing pages",
      "Running and measuring paid ads",
      "Freelance profiles, pricing and proposals",
      "Client communication and delivery",
      "Capstone: launch a campaign for a real brand",
    ],
  },
];

function makeLessons(course: FixtureCourse, courseIndex: number): Lesson[] {
  return course.lessonTitles.map((title, index) => ({
    id: `${course.id}-lesson-${index + 1}`,
    courseId: course.id,
    position: index + 1,
    title,
    youtubeId: videos[(courseIndex + index) % videos.length],
    durationMin: 12 + ((index * 7 + courseIndex * 3) % 26),
    isFree: index === 0,
  }));
}

export const fixtureLessons: Record<string, Lesson[]> = Object.fromEntries(
  rawCourses.map((course, index) => [course.slug, makeLessons(course, index)]),
);

export const fixtureCourses: Course[] = rawCourses.map(({ lessonTitles, ...course }, index) => ({
  ...course,
  lessonsCount: lessonTitles.length,
  studentsCount: [1840, 1290, 980, 1510, 1120, 860, 740, 1340][index] ?? 0,
}));

export const fixtureReviews: Review[] = [
  {
    id: "review-1",
    courseId: "course-full-stack",
    userId: "demo-student-1",
    authorName: "Amina Bello",
    rating: 5,
    comment:
      "The projects are the best part. I shipped my capstone to a real client two weeks after finishing and it paid for the course.",
    createdAt: "2026-08-14T10:00:00.000Z",
  },
  {
    id: "review-2",
    courseId: "course-full-stack",
    userId: "demo-student-2",
    authorName: "Tunde Okafor",
    rating: 5,
    comment:
      "Clear explanations, no unnecessary jargon. The section on authentication finally made everything click for me.",
    createdAt: "2026-07-29T10:00:00.000Z",
  },
  {
    id: "review-3",
    courseId: "course-python",
    userId: "demo-student-3",
    authorName: "Grace Eze",
    rating: 5,
    comment: "I had zero coding experience. By lesson four I was automating my monthly reports at work.",
    createdAt: "2026-08-02T10:00:00.000Z",
  },
  {
    id: "review-4",
    courseId: "course-security",
    userId: "demo-student-4",
    authorName: "Ibrahim Musa",
    rating: 5,
    comment: "Very practical. The threat modelling exercise changed how I look at every system at work.",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "review-5",
    courseId: "course-networking",
    userId: "demo-student-5",
    authorName: "Chidi Nwosu",
    rating: 4,
    comment: "The CCTV commissioning walkthrough is gold. I used the exact checklist on a school installation.",
    createdAt: "2026-06-18T10:00:00.000Z",
  },
  {
    id: "review-6",
    courseId: "course-design",
    userId: "demo-student-6",
    authorName: "Fatima Kalu",
    rating: 5,
    comment: "I finally have a portfolio case study I'm proud to show. The design system lesson was worth it alone.",
    createdAt: "2026-07-11T10:00:00.000Z",
  },
];

export type FixtureExam = {
  title: string;
  passScore: number;
  timeLimitMin: number;
  questions: { prompt: string; options: string[]; correctIndex: number }[];
};

export const fixtureExams: Record<string, FixtureExam> = {
  "full-stack-web-development": {
    title: "Full-Stack Web Development — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "Which HTTP method is normally used to create a new resource?",
        options: ["GET", "POST", "DELETE", "HEAD"],
        correctIndex: 1,
      },
      {
        prompt: "What does JSX allow you to write inside JavaScript?",
        options: ["SQL queries", "HTML-like markup", "CSS animations", "Shell commands"],
        correctIndex: 1,
      },
      {
        prompt: "Which tool is commonly used to style a responsive layout with rows and columns?",
        options: ["Flexbox", "JSON", "Regex", "cURL"],
        correctIndex: 0,
      },
      {
        prompt: "What is the main purpose of authenticating a user?",
        options: ["Improve page speed", "Verify identity", "Compress images", "Cache database rows"],
        correctIndex: 1,
      },
      {
        prompt: "A 401 response usually means:",
        options: ["Server crashed", "Not authorised", "Page not found", "Request succeeded"],
        correctIndex: 1,
      },
    ],
  },
  "python-for-everyone": {
    title: "Python for Everyone — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "Which keyword defines a function in Python?",
        options: ["func", "def", "function", "lambda"],
        correctIndex: 1,
      },
      {
        prompt: "Which data type stores key-value pairs?",
        options: ["list", "tuple", "dictionary", "set"],
        correctIndex: 2,
      },
      {
        prompt: "What does len([1, 2, 3]) return?",
        options: ["2", "3", "6", "An error"],
        correctIndex: 1,
      },
      {
        prompt: "Which block handles an exception?",
        options: ["except", "catch", "rescue", "handle"],
        correctIndex: 0,
      },
      {
        prompt: "How do you open a file for reading?",
        options: ['open("f.txt", "r")', 'read("f.txt")', 'file.open("f.txt")', 'open("f.txt", "w")'],
        correctIndex: 0,
      },
    ],
  },
  "networking-cctv-installation": {
    title: "Networking & CCTV — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "Which device connects separate networks together?",
        options: ["Switch", "Router", "Hub", "Repeater"],
        correctIndex: 1,
      },
      {
        prompt: "What does DHCP do?",
        options: ["Assigns IP addresses automatically", "Encrypts traffic", "Stores camera footage", "Blocks malware"],
        correctIndex: 0,
      },
      {
        prompt: "A /24 subnet mask corresponds to:",
        options: ["255.0.0.0", "255.255.0.0", "255.255.255.0", "255.255.255.255"],
        correctIndex: 2,
      },
      {
        prompt: "What is the role of an NVR?",
        options: ["Provide Wi-Fi", "Record and manage IP camera video", "Convert HDMI to VGA", "Boost monitor brightness"],
        correctIndex: 1,
      },
      {
        prompt: "Which cable is most commonly used for wired Ethernet?",
        options: ["HDMI", "Cat6", "VGA", "USB-C"],
        correctIndex: 1,
      },
    ],
  },
  "cybersecurity-essentials": {
    title: "Cybersecurity Essentials — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "What is phishing?",
        options: ["A network topology", "A social engineering attack", "A backup strategy", "A password hash"],
        correctIndex: 1,
      },
      {
        prompt: "Multi-factor authentication adds protection by:",
        options: ["Using longer usernames", "Requiring a second proof of identity", "Disabling passwords", "Encrypting the monitor"],
        correctIndex: 1,
      },
      {
        prompt: "Which practice best protects stored passwords?",
        options: ["Plain text", "Reversible encryption", "Salted hashing", "Emailing them to admins"],
        correctIndex: 2,
      },
      {
        prompt: "SQL injection is prevented primarily by:",
        options: ["Parameterised queries", "Longer passwords", "Using GET requests", "Faster servers"],
        correctIndex: 0,
      },
      {
        prompt: "The principle of least privilege means:",
        options: ["Everyone is an admin", "Only grant the access needed", "Disable logging", "Share one account"],
        correctIndex: 1,
      },
    ],
  },
  "data-analysis-excel-sql": {
    title: "Data Analysis — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "Which SQL clause filters rows?",
        options: ["ORDER BY", "WHERE", "GROUP BY", "LIMIT"],
        correctIndex: 1,
      },
      {
        prompt: "A pivot table is used to:",
        options: ["Summarise and cross-tabulate data", "Encrypt a workbook", "Design a logo", "Host a website"],
        correctIndex: 0,
      },
      {
        prompt: "Which join returns only matching rows from both tables?",
        options: ["LEFT JOIN", "RIGHT JOIN", "INNER JOIN", "FULL JOIN"],
        correctIndex: 2,
      },
      {
        prompt: "Which function counts numeric values in Excel?",
        options: ["COUNT", "AVERAGE", "VLOOKUP", "CONCAT"],
        correctIndex: 0,
      },
      {
        prompt: "GROUP BY is normally combined with:",
        options: ["Aggregate functions", "DROP TABLE", "COMMIT", "CREATE INDEX"],
        correctIndex: 0,
      },
    ],
  },
  "ui-ux-design-masterclass": {
    title: "UI/UX Masterclass — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "A user persona is:",
        options: ["A fictional representation of a user group", "A colour palette", "A CSS framework", "A testing tool"],
        correctIndex: 0,
      },
      {
        prompt: "Wireframes are primarily used to:",
        options: ["Finalise brand colours", "Plan structure and layout", "Write backend code", "Measure server load"],
        correctIndex: 1,
      },
      {
        prompt: "Which principle improves accessibility?",
        options: ["Low contrast text", "Keyboard navigability", "Tiny tap targets", "Autoplaying audio"],
        correctIndex: 1,
      },
      {
        prompt: "A design system mainly provides:",
        options: ["Reusable components and rules", "A hosting server", "A payment gateway", "A database schema"],
        correctIndex: 0,
      },
      {
        prompt: "Usability testing is valuable because it:",
        options: ["Proves the designer is right", "Reveals real user friction", "Replaces all research", "Removes the need for prototypes"],
        correctIndex: 1,
      },
    ],
  },
  "computer-repair-maintenance": {
    title: "Computer Repair — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "Which component performs most calculations in a PC?",
        options: ["RAM", "CPU", "PSU", "SSD"],
        correctIndex: 1,
      },
      {
        prompt: "What does RAM store?",
        options: ["Permanent files", "Temporary working data", "BIOS settings", "Network packets"],
        correctIndex: 1,
      },
      {
        prompt: "Before opening a desktop case you should:",
        options: ["Power it off and discharge static", "Run a benchmark", "Remove the CPU fan while running", "Update the BIOS"],
        correctIndex: 0,
      },
      {
        prompt: "A computer that powers on but shows no display most likely has:",
        options: ["A display or RAM issue", "A new keyboard", "A full recycle bin", "An outdated mouse"],
        correctIndex: 0,
      },
      {
        prompt: "Preventive maintenance includes:",
        options: ["Cleaning dust and updating software", "Ignoring error logs", "Overclocking every machine", "Removing all backups"],
        correctIndex: 0,
      },
    ],
  },
  "digital-marketing-freelancing": {
    title: "Digital Marketing — Final Exam",
    passScore: 70,
    timeLimitMin: 15,
    questions: [
      {
        prompt: "SEO stands for:",
        options: ["Search Engine Optimisation", "Social Engagement Online", "Secure Email Operation", "Sales Enablement Output"],
        correctIndex: 0,
      },
      {
        prompt: "A landing page is designed to:",
        options: ["Drive a specific action", "Host a database", "Replace a homepage", "Train staff"],
        correctIndex: 0,
      },
      {
        prompt: "Which metric measures ad clicks divided by impressions?",
        options: ["CPA", "CTR", "LTV", "ROI"],
        correctIndex: 1,
      },
      {
        prompt: "A good freelance proposal should focus on:",
        options: ["The client's outcome", "Your life story", "Every tool you know", "Longer is always better"],
        correctIndex: 0,
      },
      {
        prompt: "Content marketing works best when it is:",
        options: ["Consistent and useful", "Published once", "Hidden from search", "Only about the brand"],
        correctIndex: 0,
      },
    ],
  },
};
