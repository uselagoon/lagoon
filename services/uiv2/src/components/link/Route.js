import Link from 'next/link';

export const getLinkData = (environmentSlug, projectSlug, routeSlug) => ({
  urlObject: {
    pathname: '/route',
    query: { openshiftProjectName: environmentSlug }
  },
  asPath: `/project/${projectSlug}/${environmentSlug}/${routeSlug}`
});

/**
 * Links to the primary route page given the project name and the openshift project name.
 */
const RouteLink = ({
  environmentSlug,
  projectSlug,
  routeSlug,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(environmentSlug, projectSlug, routeSlug);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default RouteLink;
