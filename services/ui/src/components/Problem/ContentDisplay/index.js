import React from "react";
import { bp, color, fontSize } from 'lib/variables';
import DrutinyContent from "components/Problem/ContentDisplay/DrutinyContent";
import DefaultDisplay from "components/Problem/ContentDisplay/DefaultContent";
// import ProblemLink from "components/link/Problem";

// {problem.environment.project &&
// <>
//     <label>History</label>
//     <ProblemLink
//         problemSlug={problem.identifier.toLowerCase()}
//         environmentSlug={problem.environment.openshiftProjectName}
//         projectSlug={problem.environment.project.name}
//         className="more"
//     >
//         See history of this problem
//     </ProblemLink>
// </>
// }

const ContentDisplay = ({ problem }) => (
    <>
        {problem.source.startsWith("Drutiny") ? (
            <DrutinyContent problem={problem} />
        ) : (
            <DefaultDisplay problem={problem} />
        )}
    </>
);

export default ContentDisplay;
