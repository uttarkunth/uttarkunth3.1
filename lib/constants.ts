export const BRAND = {
  name: "Uttarkunth Stays",
  parentBrand: "Uttarkunth",
  version: "3.0",
  founder: "Gaurav Negi",
  headquarters: "Jari, Kasol, Kullu, Parvati Valley, Himachal Pradesh, India",
  philosophy: "Learn by Doing • Grow by Serving",
  tagline: "Authentic Himalayan Hospitality & Community-Rooted Stays",
  contactEmail: "info@uttarkunth.com",
  phone: "+91 98765 43210", // Genuine support channel
  colors: {
    forest: "#13612E",
    forestDark: "#0D2117",
    blue: "#3182CE",
    deepBlue: "#2B6CB0",
    orange: "#C85A20", // Official logo & accent color
    ivory: "#FAF7F0",
    charcoal: "#29251F",
  }
};

export const COMMISSION_CONFIG = {
  introMonths: 12,
  introRate: 0.0, // 0% for first 12 months with signed agreement
  standardRate: 10.0, // 10% standard thereafter
};

export const ADMIN_EMAILS = [
  'gauravnegi748@gmail.com',
  'info@uttarkunth.com',
  'uttarkunth@gmail.com'
];

export function isPlatformAdmin(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

export const DESTINATIONS = [
  { name: "Jari", valley: "Parvati Valley", state: "Himachal Pradesh", count: 2, featured: true },
  { name: "Kasol", valley: "Parvati Valley", state: "Himachal Pradesh", count: 0, featured: true },
  { name: "Tosh & Pulga", valley: "Parvati Valley", state: "Himachal Pradesh", count: 0, featured: false },
  { name: "Kullu", valley: "Kullu Valley", state: "Himachal Pradesh", count: 0, featured: true },
  { name: "Manali", valley: "Kullu Valley", state: "Himachal Pradesh", count: 0, featured: false },
  { name: "Tirthan Valley", valley: "Tirthan", state: "Himachal Pradesh", count: 0, featured: false },
  { name: "Spiti Valley", valley: "Spiti", state: "Himachal Pradesh", count: 0, featured: false },
];

export const AMENITIES_LIST = [
  "Free Wi-Fi",
  "Mountain-view room",
  "Breakfast and dinner meal plans",
  "Tea and coffee",
  "Free Parking",
  "Balcony",
  "Kitchenette",
  "Laundry",
  "Pet-friendly by prior agreement",
  "Hot Water",
  "Local Guided Hikes",
  "Bonfire on Request",
  "Workstation Friendly"
];

export const PROPERTY_TYPES = [
  { id: "homestay", label: "Homestay" },
  { id: "cottage", label: "Mountain Cottage" },
  { id: "guesthouse", label: "Traditional Guesthouse" },
  { id: "villa", label: "Himalayan Villa" },
  { id: "resort", label: "Eco Retreat" },
  { id: "other", label: "Other Local Stay" },
];

// Verified Existing Properties Data
export const EXISTING_PROPERTIES = [
  {
    id: "d9bba1a1-23bc-4844-a70b-aebcc820cf37",
    slug: "yash-home-stay",
    name: "Yash Home Stay",
    village: "Jari",
    district: "Kullu",
    state: "Himachal Pradesh",
    address: "Jari, Kullu, Himachal Pradesh, India",
    description: "A peaceful homestay in Jari, close to the mountains and village life. A welcoming place to relax, enjoy home-style food, and experience the Himalayas.",
    amenities: [
      "Free Wi-Fi",
      "Mountain-view room",
      "Breakfast and dinner meal plans",
      "Tea and coffee",
      "Laundry",
      "Pet-friendly by prior agreement"
    ],
    photos: [
      "https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/Yash%20home%20stay/unnamed.png",
      "https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/Yash%20home%20stay/64749a66-252f-4c8f-a67e-028ce7557ce6.jpeg",
      "https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/Yash%20home%20stay/17e473d2-e8a8-4904-85f2-0fccdb760b2e.jpeg"
    ],
    property_type: "homestay",
    booking_mode: "request",
    published: true,
    moderation_status: "approved",
    rooms: [
      {
        id: "c7391669-92a0-4456-8e13-c7bab6661681",
        property_id: "d9bba1a1-23bc-4844-a70b-aebcc820cf37",
        room_name: "Mountain View Room",
        description: "A peaceful room with mountain views, ideal for relaxing or working from the mountains.",
        max_guests: 2,
        base_price: 900,
        active: true
      }
    ]
  },
  {
    id: "b1a8c6a7-e73c-431c-8727-c8e385dbd173",
    slug: "wonderway-retreat",
    name: "Wonderway Retreat",
    village: "Jari",
    district: "Kullu",
    state: "Himachal Pradesh",
    address: "Jari Kullu Himachal Pradesh",
    description: "A peaceful homestay in Jari with garden and mountain views, a balcony, and a kitchenette.",
    amenities: [
      "Mountain-view room",
      "Breakfast and dinner meal plans",
      "Tea and coffee",
      "Pet-friendly by prior agreement",
      "Free Parking"
    ],
    photos: [
      "https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/wonderway%20retreat/wonderway2.jpeg",
      "https://xyplgugxpmlnjsvlosdg.supabase.co/storage/v1/object/public/property-photos/wonderway%20retreat/wonderway3.jpeg"
    ],
    property_type: "homestay",
    booking_mode: "request",
    published: true,
    moderation_status: "approved",
    rooms: [
      {
        id: "f1514d43-b914-4ffb-8213-ac17d58d7403",
        property_id: "b1a8c6a7-e73c-431c-8727-c8e385dbd173",
        room_name: "Mountain View Room",
        description: "A private mountain-view room in Jari, ideal for a peaceful Himalayan stay.",
        max_guests: 2,
        base_price: 3500,
        active: true
      }
    ]
  }
];
