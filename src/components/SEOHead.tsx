import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  path?: string;
  canonical?: string;
  type?: string;
  image?: string;
  imageAlt?: string;
  jsonLd?: Record<string, any>;
}

export default function SEOHead({
  title,
  description,
  keywords,
  path = "",
  canonical,
  type = "website",
  image = "https://cosmicframe.app/og-default.jpg",
  imageAlt = "Andromeda Galaxy (M 31) — Cosmic Frame",
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title.includes("Cosmic Frame") ? title : `${title} — Cosmic Frame`;
  const url = canonical || `https://cosmicframe.app${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {/* meta keywords intentionally omitted — ignored by Google */}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={imageAlt} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
