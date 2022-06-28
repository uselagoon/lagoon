import Link from 'next/link';

export const getLinkData = (projectGroupSlug, organizationSlug, organizationName) => ({
  urlObject: {
    pathname: '/org-project',
    query: { projectName: projectGroupSlug, organizationSlug: organizationSlug, organizationName: organizationName }
  },
  asPath: `/organizations/${organizationSlug}/projects/${projectGroupSlug}`
});

/**
 * Links to the group page given the project name and the openshift project name.
 */
const ProjectGroupLink = ({
  projectGroupSlug,
  organizationSlug,
  organizationName,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(projectGroupSlug, organizationSlug, organizationName);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default ProjectGroupLink;
