import React from "react";
import { bp, color, fontSize } from 'lib/variables';
import DrutinyContent from "components/Problem/ContentDisplay/DrutinyContent";
import DefaultDisplay from "components/Problem/ContentDisplay/DefaultContent";

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
