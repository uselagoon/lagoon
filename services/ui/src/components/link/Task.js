import Link from 'next/link';

export const getLinkData = (taskSlug, environmentSlug, projectSlug) => ({
  urlObject: {
    pathname: '/task',
    query: {
      openshiftProjectName: environmentSlug,
      taskName: taskSlug
    }
  },
  asPath: `/projects/${projectSlug}/${environmentSlug}/tasks/${taskSlug}`
});

/**
 * Links to the task page given the task ID, project name and the openshift project name.
 */
const TaskLink = ({
  taskSlug,
  environmentSlug,
  projectSlug,
  children,
  className = null,
  prefetch = false
}) => {
  const linkData = getLinkData(taskSlug, environmentSlug, projectSlug);

  return (
    <Link href={linkData.urlObject} as={linkData.asPath} prefetch={prefetch}>
      <a className={className}>{children}</a>
    </Link>
  );
};

export default TaskLink;
