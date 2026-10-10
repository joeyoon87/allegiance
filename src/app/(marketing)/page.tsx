import { Hero } from "@/components/home/Hero";
import { PartnerSolutions } from "@/components/home/PartnerSolutions";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { TransitionalCareSpotlight } from "@/components/home/TransitionalCareSpotlight";
import { HowItWorks } from "@/components/home/HowItWorks";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { ServiceAreaSection } from "@/components/home/ServiceAreaSection";
import { FinalCta } from "@/components/home/FinalCta";
import { SERVICE_AREA_COUNTIES, SITE } from "@/lib/constants";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: SITE.name,
  url: SITE.url,
  telephone: SITE.phone,
  email: SITE.dispatchEmail,
  areaServed: SERVICE_AREA_COUNTIES.map((county) => ({ "@type": "AdministrativeArea", name: county })),
  address: {
    "@type": "PostalAddress",
    addressRegion: "NC",
    addressCountry: "US",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Hero />
      <PartnerSolutions />
      <ServicesGrid />
      <TransitionalCareSpotlight />
      <HowItWorks />
      <WhyChooseUs />
      <ServiceAreaSection />
      <FinalCta />
    </>
  );
}
