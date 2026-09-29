import type { PageContent } from "./page-content";

export const SAMPLE_PAGE_SLUG = "sample";
export const SAMPLE_PAGE_NAME = "Sample SaaS page";

/**
 * A representative published page using every section type. Used by the seed
 * script and by tests (it must pass the publish schema). The product is
 * fictional.
 */
export const samplePageContent: PageContent = {
  schemaVersion: 1,
  meta: {
    title: "Tidewell: Project planning for focused teams",
    description:
      "Tidewell brings roadmaps, tasks and team updates into one calm workspace, so your team can ship without the status meetings.",
  },
  sections: [
    {
      id: "hero",
      type: "hero",
      data: {
        eyebrow: "New: Weekly digests",
        heading: "Plan less. Ship more.",
        subheading:
          "Tidewell brings roadmaps, tasks and team updates into one calm workspace, so everyone knows what matters this week.",
        primaryButton: { label: "Start free trial", href: "#pricing" },
        secondaryButton: { label: "See how it works", href: "#features" },
      },
    },
    {
      id: "features",
      type: "features",
      data: {
        heading: "Everything your team needs to stay in sync",
        description:
          "Replace scattered docs, spreadsheets and status meetings with a single source of truth.",
        items: [
          {
            id: "feature-roadmaps",
            icon: "layers",
            title: "Connected roadmaps",
            description:
              "Link long-term goals to the tasks that move them forward and see progress update automatically.",
          },
          {
            id: "feature-digests",
            icon: "message-square",
            title: "Weekly digests",
            description:
              "Every Friday, each team gets a short summary of what shipped, what slipped and what is next.",
          },
          {
            id: "feature-insights",
            icon: "chart-column",
            title: "Workload insights",
            description:
              "Spot overloaded teammates early and rebalance work before deadlines are at risk.",
          },
          {
            id: "feature-speed",
            icon: "zap",
            title: "Fast by default",
            description:
              "Keyboard shortcuts and instant search keep you in flow instead of waiting on the tool.",
          },
          {
            id: "feature-permissions",
            icon: "lock",
            title: "Granular permissions",
            description:
              "Share plans with clients and contractors without exposing your internal work.",
          },
          {
            id: "feature-timezones",
            icon: "globe",
            title: "Built for remote teams",
            description:
              "Time-zone aware deadlines and async updates make distributed work feel effortless.",
          },
        ],
      },
    },
    {
      id: "testimonials",
      type: "testimonials",
      data: {
        heading: "Loved by teams that ship",
        items: [
          {
            id: "testimonial-maya",
            quote:
              "We cancelled two recurring status meetings in our first month. The weekly digest tells everyone what they need to know.",
            name: "Maya Okafor",
            role: "Head of Product, Brightlane",
          },
          {
            id: "testimonial-daniel",
            quote:
              "Tidewell is the first planning tool our engineers actually open without being reminded.",
            name: "Daniel Reyes",
            role: "Engineering Manager, Northbeam",
          },
          {
            id: "testimonial-priya",
            quote:
              "Seeing workload across teams helped us hit our launch date without burning anyone out.",
            name: "Priya Shah",
            role: "COO, Fernwood Studio",
          },
        ],
      },
    },
    {
      id: "pricing",
      type: "pricing",
      data: {
        heading: "Simple pricing that scales with you",
        description: "Start free. Upgrade when your team is ready.",
        plans: [
          {
            id: "plan-starter",
            name: "Starter",
            price: "$0",
            period: "per month",
            description: "For small teams trying Tidewell out.",
            features: ["Up to 5 members", "3 active projects", "Weekly digests"],
            buttonLabel: "Get started",
            buttonHref: "#cta",
            highlighted: false,
          },
          {
            id: "plan-team",
            name: "Team",
            price: "$12",
            period: "per user / month",
            description: "For growing teams that plan together.",
            features: [
              "Unlimited members",
              "Unlimited projects",
              "Connected roadmaps",
              "Workload insights",
            ],
            buttonLabel: "Start free trial",
            buttonHref: "#cta",
            highlighted: true,
          },
          {
            id: "plan-enterprise",
            name: "Enterprise",
            price: "Custom",
            period: "billed annually",
            description: "For organizations with advanced needs.",
            features: [
              "Everything in Team",
              "SSO and audit logs",
              "Dedicated success manager",
            ],
            buttonLabel: "Contact sales",
            buttonHref: "mailto:sales@example.com",
            highlighted: false,
          },
        ],
      },
    },
    {
      id: "faq",
      type: "faq",
      data: {
        heading: "Frequently asked questions",
        items: [
          {
            id: "faq-trial",
            question: "How does the free trial work?",
            answer:
              "You get full access to the Team plan for 14 days. No credit card is required, and you can switch to Starter at any time.",
          },
          {
            id: "faq-import",
            question: "Can I import my existing projects?",
            answer:
              "Yes. Tidewell imports from CSV and from most popular project management tools in a few clicks.",
          },
          {
            id: "faq-security",
            question: "Is my data secure?",
            answer:
              "All data is encrypted in transit and at rest, and Enterprise plans include SSO and audit logs.",
          },
          {
            id: "faq-cancel",
            question: "Can I cancel at any time?",
            answer:
              "Absolutely. Plans are billed monthly or annually and you can cancel from your account settings.",
          },
        ],
      },
    },
    {
      id: "cta",
      type: "cta",
      data: {
        heading: "Give your team a calmer way to plan",
        description:
          "Set up your first roadmap in minutes. Free for 14 days, no credit card required.",
        button: {
          label: "Start free trial",
          href: "mailto:hello@example.com?subject=Tidewell%20trial",
        },
      },
    },
    {
      id: "footer",
      type: "footer",
      data: {
        brandName: "Tidewell",
        tagline: "Project planning for focused teams.",
        links: [
          { id: "link-features", label: "Features", href: "#features" },
          { id: "link-pricing", label: "Pricing", href: "#pricing" },
          { id: "link-faq", label: "FAQ", href: "#faq" },
          { id: "link-contact", label: "Contact", href: "mailto:hello@example.com" },
        ],
        copyright: "© 2026 Tidewell, Inc. All rights reserved.",
      },
    },
  ],
};
