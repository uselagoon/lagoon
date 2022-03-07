import Link from 'next/link';

export const getLinkData = (bulkIdSlug) => ({
  urlObject: {
    pathname: '/bulkdeployment',
    query: {
      bulkId: bulkIdSlug
    }
  },
  asPath: `/bulkdeployment/${bulkIdSlug}`
});

/**
 * Links to the deployment page given the deployment name, the project name and the openshift project name.
 */
const BulkDeploymentLink = ({
  bulkIdSlug,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(bulkIdSlug);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default BulkDeploymentLink;
