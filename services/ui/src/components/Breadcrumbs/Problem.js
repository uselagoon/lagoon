import React from 'react';
import { getLinkData } from 'components/link/Problem';
import Breadcrumb from 'components/Breadcrumbs/Breadcrumb';

const EnvironmentBreadcrumb = ({ header, problemSlug, environmentSlug, projectSlug }) => {
    const linkData = {
        urlObject: {
            pathname: '/problems',
            query: { openshiftProjectName: environmentSlug }
        },
        asPath: `/projects/${projectSlug}/${environmentSlug}/problems`
    };

    return (
        <Breadcrumb
            header={header}
            title={problemSlug}
            {...linkData}
        />
    );
};

export default EnvironmentBreadcrumb;
