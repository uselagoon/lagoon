import Link from 'next/link';

export const getLinkData = (deploymentSlug, environmentSlug, projectSlug) => ({
  urlObject: {
    pathname: '/deployment',
    query: {
      openshiftProjectName: environmentSlug,
      deploymentName: deploymentSlug
    }
  },
  asPath: `/projects/${projectSlug}/${environmentSlug}/deployments/${deploymentSlug}`
});

/**
 * Links to the deployment page given the deployment name, the project name and the openshift project name.
 */
const DeploymentLink = ({
  deploymentSlug,
  environmentSlug,
  projectSlug,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(deploymentSlug, environmentSlug, projectSlug);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default DeploymentLink;
