import Link from 'next/link';

export const getLinkData = (groupSlug, organizationSlug, organizationName) => ({
  urlObject: {
    pathname: '/org-group',
    query: { groupName: groupSlug, organizationSlug: organizationSlug, organizationName: organizationName }
  },
  asPath: `/organizations/${organizationSlug}/groups/${groupSlug}`
});

/**
 * Links to the group page given the project name and the openshift project name.
 */
const GroupLink = ({
  groupSlug,
  organizationSlug,
  organizationName,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(groupSlug, organizationSlug, organizationName);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default GroupLink;
