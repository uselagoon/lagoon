import Link from 'next/link';

export const getLinkData = (organizationSlug, organizationName) => ({
  urlObject: {
    pathname: '/org-projects',
    query: { organizationSlug: organizationSlug, organizationName: organizationName }
  },
  asPath: `/organizations/${organizationSlug}/projects`
});

/**
 * Links to the group page given the project name and the openshift project name.
 */
const OrgProjectsLink = ({
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

export default OrgProjectsLink;
