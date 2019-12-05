import Link from 'next/link';

export const getLinkData = projectSlug => ({
  urlObject: {
    pathname: '/project',
    query: { projectName: projectSlug }
  },
  asPath: `/projects/${projectSlug}`
});

/**
 * Links to the project page given the project name.
 */
const ProjectLink = ({
  projectSlug,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(projectSlug);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default ProjectLink;
