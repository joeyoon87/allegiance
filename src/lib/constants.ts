export const SITE = {
  name: "Allegiance Transportation Services",
  shortName: "Allegiance",
  domain: "rideallegiance.com",
  url: "https://rideallegiance.com",
  phone: "336-962-7433",
  phoneDisplay: "336-962-RIDE (7433)",
  phoneHref: "tel:+13369627433",
  dispatchEmail: "dispatcher@rideallegiance.com",
  tagline: "More Than Transportation. A Partner in Patient Care.",
};

export const OPERATING_HOURS = {
  office: "8:00 AM – 5:00 PM",
  transportation: "4:00 AM – 7:00 PM, Monday through Saturday",
  afterHours: "After-hours scheduling support is available. Online requests may be submitted outside normal hours but remain subject to confirmation.",
};

export const SERVICE_AREA_COUNTIES = [
  "Forsyth County",
  "Guilford County",
  "Davidson County",
  "Davie County",
  "Stokes County",
  "Yadkin County",
];

export const SERVICE_AREA_CITIES = [
  "Winston-Salem",
  "Greensboro",
  "High Point",
  "Clemmons",
  "Bermuda Run",
  "Kernersville",
];

export const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/transitional-care", label: "Transitional Care" },
  { href: "/healthcare-partners", label: "Healthcare Partners" },
  { href: "/service-area", label: "Service Area" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const SERVICES = [
  {
    slug: "wheelchair",
    name: "Wheelchair Transportation",
    short: "Professional, accessible transportation with wheelchair securement and appropriate assistance.",
    href: "/services/wheelchair",
  },
  {
    slug: "ambulatory",
    name: "Ambulatory Transportation",
    short: "Door-to-door transportation for individuals who can walk but need assistance getting to appointments.",
    href: "/services/ambulatory",
  },
  {
    slug: "companions",
    name: "Medical Appointment Companions",
    short: "Transportation plus companion assistance for appointments, procedures, and return journeys.",
    href: "/services/companions",
  },
  {
    slug: "transitional-care",
    name: "Transitional Care",
    short: "Coordinated transportation and nonclinical support when patients move between healthcare settings or return home.",
    href: "/transitional-care",
  },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;
