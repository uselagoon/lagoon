import Link from 'next/link';

export const getLinkData = (environmentSlug, projectSlug) => ({
  urlObject: {
    pathname: '/backups',
    query: { openshiftProjectName: environmentSlug }
  },
  asPath: `/projects/${projectSlug}/${environmentSlug}/backups`
});

const BackupsLink = ({
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

export default BackupsLink;
