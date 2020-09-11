import React, { useState, useEffect } from "react";
import { HexGrid, Layout, Hexagon, Text, GridGenerator } from 'react-hexgrid';
import * as R from 'ramda';
import ProblemsByProject from 'components/ProblemsByProject';
import { LoadingPageNoHeader } from 'pages/_loading';
import { ErrorNoHeader } from 'pages/_error';
import { bp } from 'lib/variables';
import './styling.css';

const config = {
    "width": 1200,
    "height": 100,
    "layout": {"width": 4, "height": 4, "flat": false, "spacing": 1.08},
    "origin": {"x": 0, "y": 0},
    "map": "rectangle",
};

const Honeycomb = ({ data, filter }) => {
    const { projectsProblems } = data || [];
    const [projects, setProjects] = useState(projects);
    const [projectInView, setProjectInView] = useState(false);
    const [display, setDisplay] = useState({type: "normal", multiplier: 2});

    const generator = GridGenerator.getGenerator(config.map);
    const projectCount = projectsProblems && parseInt(projectsProblems.length);
    const displayMultiple = display && parseInt(display.multiplier * 8);
    let rows = projectsProblems && parseInt(projectCount / displayMultiple);

    const hexs = generator.apply(config, [displayMultiple, ++rows]);
    const layout = config.layout;
    const size = {
        x: parseInt(display.hexSize * layout.width),
        y: parseInt(display.hexSize * layout.height)
    };

    const handleHexClick = (project) => {
        const {environments, id, name} = project || [];
        const problems = environments && environments.filter(e => e instanceof Object).map(e => {
            return e.problems;
        });

        const problemsPerProject = Array.prototype.concat.apply([], problems);
        const critical = problemsPerProject.filter(p => p.severity === 'CRITICAL').length;
        const high = problemsPerProject.filter(p => p.severity === 'HIGH').length;
        const medium = problemsPerProject.filter(p => p.severity === 'MEDIUM').length;
        const low = problemsPerProject.filter(p => p.severity === 'LOW').length;

        setProjectInView({name: name, environments: environments, severityCount: {critical: critical, high: high, medium: medium, low: low}});
    };

    const flattenProblems = (project) => {
        const {environments} = project || [];
        const filterProblems = environments && environments.filter(e => e instanceof Object).map(e => {
            return e.problems;
        });
        return Array.prototype.concat.apply([], filterProblems);
    };

    const sortByProjects = (projects) => {
        return projects && projects.sort((a, b) => {
            const aProblems = flattenProblems(a);
            const bProblems = flattenProblems(b);

            return bProblems.length - aProblems.length;
        });
    };

    const getClassName = (critical) => {
        if (critical === 0) { return "no-critical" }
        if (critical === 1) { return "light-red" } else
        if (critical >= 1 && critical <= 5) { return "red" } else
        if (critical >= 5 && critical < 10) { return "dark-red" } else
        if (critical >= 10) { return "darker-red" }
    };

    useEffect(() => {
        const count = projectsProblems && projectsProblems.length;
        if (count <= 48) setDisplay({type: "normal", multiplier: 2, hexSize: 4, viewBox: "180 -20 100 100"});
        if (count >= 49 && count <= 120) setDisplay({type: "small", multiplier: 3, hexSize: 2, viewBox: "125 -20 100 100"});
        if (count >= 121 && count <= 384) setDisplay({type: "smaller", multiplier: 4, hexSize: 1, viewBox: "70 -10 100 100"});
        if (count >= 385) setDisplay({type: "smallest", multiplier: 5, hexSize: 0.66, viewBox: "30 -10 100 100"});

        const filterProjects = !filter.showCleanProjects ? projectsProblems && projectsProblems.filter(p => {
            return !R.isEmpty(flattenProblems(p))
        }) : projectsProblems && projectsProblems;

        const sortProjects = filterProjects && sortByProjects(filterProjects);

        setProjects(sortProjects);
    }, [projectsProblems, filter]);

    return (
        <div className="honeycomb-display">
            {!projects && <LoadingPageNoHeader />}
            {projects &&
            <div className="content-wrapper results">
                <div className="content">
                    <label>Projects: {projects.length}</label>
                </div>
            </div>
            }
            {projects &&
            <>
                <HexGrid width={config.width} height={parseInt(display.multiplier * config.height)} viewBox={display.viewBox}>
                    <Layout size={size} flat={layout.flat} spacing={layout.spacing} origin={config.origin}>
                        {hexs.slice(0, projects.length).map((hex, i) => {
                            const project = projects[i] || null;
                            const {environments, id, name} = project;
                            const filterProblems = environments && environments.filter(e => e instanceof Object).map(e => {
                                return e.problems;
                            });

                            const problemsPerProject = Array.prototype.concat.apply([], filterProblems);
                            const critical = problemsPerProject.filter(p => p.severity === 'CRITICAL').length;
                            const problemCount = problemsPerProject.length || 0;

                            const HexText = () => {
                                const classes = display.type !== "normal" ? "no-text" : 'text';

                                if (problemsPerProject.length) {
                                    return (<Text className={classes}>
                                        {`P: ${problemCount}, C: ${critical}`}
                                    </Text>);
                                }
                                else {
                                    return <Text className={classes}>{`P: ${problemCount}`}</Text>
                                }
                            };

                            return (
                                <Hexagon key={i} q={hex.q} r={hex.r} s={hex.s} className={getClassName(critical)} onClick={() => handleHexClick(project)}>
                                    <HexText />
                                </Hexagon>
                            )})}
                    </Layout>
                </HexGrid>
                <div className="project-details">
                    <div className="content-wrapper">
                        <div className="content">
                            {projectInView ?
                                <>
                                    <div className="project"><label>Project: {projectInView.name}</label></div>
                                    {projectInView.environments && projectInView.environments.map(environment => (
                                        <div key={environment.id} className="environment-wrapper">
                                            <label className="environment"><h5>Environment: {environment.name}</h5></label>
                                            <ProblemsByProject key={environment.id} problems={environment.problems || [] } minified={true}/>
                                        </div>
                                    ))}
                                </>
                                : <div className="project">No project selected</div>
                            }
                        </div>
                    </div>
                </div>
            </>
            }
            <style jsx>{`
              .content-wrapper {
                 &.results {
                   background: #f1f1f1;
                   margin-bottom: 20px;

                   .content {
                     padding: 0 15px;
                   }
                 }
                .content {
                  margin: 0 calc((100vw / 16) * 1) 0;
                  @media ${bp.wideUp} {
                    margin: 0 calc((100vw / 16) * 2) 0;
                  }
                  @media ${bp.extraWideUp} {
                    margin: 0 calc((100vw / 16) * 3) 0;
                  }
                  li.result {
                    display: inline;
                  }
                  .project {
                    padding: 20px;
                    background: #fff;
                  }
                  .environment-wrapper {
                    padding-bottom: 20px;
                    .environment {
                      h5 {
                        padding: 10px 20px;
                        margin-top: 0;
                        background: #f3f3f3;
                      }
                    }
                  }
                }
                .loading {
                  margin: 2em calc(100vw / 2) 0;
                }
              }
            `}</style>
        </div>
    );
};

export default Honeycomb;
