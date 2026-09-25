import type { Storefront } from "@/storefront/types";

/**
 * Kate Cromuel's storefront: the first real distributor page, and the reference for every
 * other one. Copy this file to add a distributor (see README, "Adding a distributor").
 *
 * WHAT IS REAL AND WHAT IS A PLACEHOLDER
 * Only Kate's name is confirmed. Everything marked PLACEHOLDER below is a template value
 * chosen to show the design at full quality. It must be replaced with Kate's own details
 * before the page goes live, and `status` switched to "live". Until then the page shows a
 * small "Preview" ribbon listing `pending`, and never opens a chat to a real number.
 * docs/LAUNCH.md lists what to ask Kate for.
 *
 * Never add qualifications, years of experience, medical credentials or sourcing claims
 * unless Kate has given them to us and they can be checked.
 */
export const kate: Storefront = {
  slug: "kate",
  status: "preview",
  pending: ["prices", "WhatsApp number", "service area", "delivery details", "photo", "introduction"],

  distributor: {
    name: "Kate Cromuel",
    firstName: "Kate",
    role: "Independent BF Suma distributor",
    photo: null, // PLACEHOLDER: a real photo of Kate, e.g. { src: "/storefronts/kate.jpg", alt: "Kate Cromuel" }
    intro:
      // PLACEHOLDER: Kate's own words. Keep it to one or two sentences, and about the customer.
      "I'd rather you buy the one product that fits than five you don't need. Tell me what you're looking for and I'll help you choose, and I'm on WhatsApp for any question before or after you order.",
    area: "Nairobi", // PLACEHOLDER
    languages: ["English", "Kiswahili"], // PLACEHOLDER
    hours: null, // PLACEHOLDER: e.g. "Monday to Saturday, 8am to 7pm"
    whatsapp: null, // PLACEHOLDER: Kate's WhatsApp number, e.g. "2547XXXXXXXX". null keeps the page in preview.
    phone: null,
  },

  // Jacaranda: the trees that turn Nairobi purple every October.
  theme: {
    accent: "#4b3a8c",
    accentStrong: "#36296a",
    accentSoft: "#ece8f6",
    onAccent: "#ffffff",
  },

  catalogue: {
    currency: "KES",
    updated: "2026-09-24", // PLACEHOLDER: the date Kate last confirmed her prices
    // PLACEHOLDER: the products Kate is asked about most. Shown first when browsing.
    featured: ["refined-yunzhi", "probio3", "arthroxtra", "cordyceps-coffee", "veggie-veggie", "gymeffect"],
    // PLACEHOLDER PRICES. Rough retail levels for illustration only: replace every price with
    // Kate's own price list. Pack sizes are left out until checked against the label.
    offers: {
      "refined-yunzhi": { price: 7100 },
      "ganoderma-spores": { price: 10900 },
      "quad-reishi": { price: 7600 },
      "cordyceps-coffee": { price: 3200 },
      "reishi-coffee": { price: 3200 },
      "nmn-coffee": { price: 5400 },
      "micro2-cycle": { price: 5800 },
      "relivin-tea": { price: 3600 },
      cerebrain: { price: 4300 },
      detoxilive: { price: 4600 },
      arthroxtra: { price: 4700 },
      "gluzojoint-f": { price: 5200 },
      "zaminocal-plus": { price: 4300 },
      "femicalcium-d3": { price: 3500 },
      "veggie-veggie": { price: 4100 },
      probio3: { price: 3900 },
      constirelax: { price: 3600 },
      "novel-depile": { price: 4200 },
      "ez-xlim": { price: 5600 },
      gymeffect: { price: 5400 },
      glugogone: { price: 4900 },
      "nmn-duo": { price: 24000 },
      "youth-ever": { price: 7800 },
      feminergy: { price: 4800 },
      femicare: { price: 2300 },
      "youth-essence": { price: 8900 },
      prostatrelax: { price: 5300 },
      "xpower-man-plus": { price: 6400 },
      "xpower-coffee": { price: 3400 },
    },
  },

  fulfilment: {
    // PLACEHOLDER: Kate's real delivery areas, fees and times. A null fee means Kate confirms it.
    delivery: {
      areas: [
        { id: "nairobi", label: "Within Nairobi", fee: null, time: null },
        { id: "courier", label: "Outside Nairobi, by courier", fee: null, time: null },
      ],
      note: "Kate confirms the delivery cost and day with you before you pay.",
    },
    pickup: null, // PLACEHOLDER: e.g. { label: "Collect from Kate", detail: "Westlands, by arrangement" }
  },

  payment: {
    methods: ["mpesa", "cash"], // PLACEHOLDER: confirm with Kate
    mpesa: null, // PLACEHOLDER: { kind: "till", number: "123456", name: "Kate Cromuel" }
  },

  suppliSlug: null, // Set to Kate's Suppli Afya link name once she has a workspace.
};
