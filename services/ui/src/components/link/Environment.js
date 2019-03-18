import Link from 'next/link';

export const getLinkData = (environmentSlug, projectSlug) => ({
  urlObject: {
    pathname: '/environment',
    query: { openshiftProjectName: environmentSlug }
  },
  asPath: `/projects/${projectSlug}/${environmentSlug}`
});

const EnvironmentLink = ({
  environmentSlug,
  projectSlug,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(environmentSlug, projectSlug);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default EnvironmentLink;
