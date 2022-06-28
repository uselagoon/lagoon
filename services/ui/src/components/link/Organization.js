import Link from 'next/link';

export const getLinkData = (organizationSlug, organizationName) => ({
  urlObject: {
    pathname: '/organization',
    query: { organizationSlug: organizationSlug, organizationName: organizationName }
  },
  asPath: `/organizations/${organizationSlug}`
});

/**
 * Links to the organization page given the organization id.
 */
const OrganizationLink = ({
  organizationSlug,
  organizationName,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(organizationSlug, organizationName);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default OrganizationLink;
