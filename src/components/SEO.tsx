import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  type?: string;
}

const BASE_URL = "https://ward-circle-social.lovable.app";
const SITE_NAME = "Conect";
const DEFAULT_DESCRIPTION = "Kenya's community-driven social platform. Connect with your ward, county & beyond. Share stories, trade on the marketplace, join groups & discover what's trending.";

const SEO = ({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  type = "website",
}: SEOProps) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} – Kenya's Community Social Platform`;
  const url = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={`${BASE_URL}/og-image.png`} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${BASE_URL}/og-image.png`} />
    </Helmet>
  );
};

export default SEO;
