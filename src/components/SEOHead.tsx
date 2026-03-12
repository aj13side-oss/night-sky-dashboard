import { Helmet } from "react-helmet-async";

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  path?: string;
  type?: string;
  image?: string;
  jsonLd?: Record<string, any>;
}

export default function SEOHead({
  title,
  description,
  keywords,
  path = "",
  type = "website",
  image = "/og-image.png",
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = `${title} — AstroDash`;
  const url = `https://astrodash.fr${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
