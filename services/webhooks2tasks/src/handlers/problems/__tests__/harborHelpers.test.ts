import {extractVulnerabilities, matchRepositoryAgainstPatterns, validateAndTransformIncomingWebhookdata} from '../harborHelpers'
import fs from 'fs'

// INCOMING WEBHOOK PARSING TESTS FOLLOW

test('that Habor v1 incoming webhook data extracts correct project details', () => {
    const v1incomingwebhookdataBuffer = fs.readFileSync(__dirname + "/files/v1incomingwebhookdata.json")
    const v1incomingwebhookdata = JSON.parse(v1incomingwebhookdataBuffer.toString())

    //Note that presently we only actually parse the "resources.repo_full_name" to pull the repo name
    const projectDetails = validateAndTransformIncomingWebhookdata([], v1incomingwebhookdata);
    expect(projectDetails.lagoonProjectName).toEqual("projectname-here")
    expect(projectDetails.lagoonEnvironmentName).toEqual("environmentname-here")
    expect(projectDetails.lagoonServiceName).toEqual("servicename-here")
})

// VULNERABILITY SCAN RESULT TESTS FOLLOW

test('that Harbor v1 vulnerabilities are extracted correctly', () => {
    const v1testdataBuffer = fs.readFileSync(__dirname + "/files/v1scanresults.output.json")
    const v1testdata = JSON.parse(v1testdataBuffer.toString())

    const vulnerabilityList = extractVulnerabilities(v1testdata)
    //this vulnerability list has 89 elements - as counted by `jq '.[].vulnerabilities|length' v1scanresults.output.json`
    expect(vulnerabilityList.length).toEqual(89)
})

test('that Harbor v2 vulnerabilities are extracted correctly', () => {
    const v1testdataBuffer = fs.readFileSync(__dirname + "/files/v1scanresults.output.json")
    const v1testdata = JSON.parse(v1testdataBuffer.toString())

    const vulnerabilityList = extractVulnerabilities(v1testdata)
    //this vulnerability list has 89 elements - as counted by `jq '.[].vulnerabilities|length' v1scanresults.output.json`
    expect(vulnerabilityList.length).toEqual(89)
})


// PATTERN MATCH TESTS FOLLOW

test('that incoming names are matched by the default match pattern',() => {
    const reponame = "projectname-here/environmentname-here/servicename-here"
    const matchDetails = matchRepositoryAgainstPatterns(reponame)
    expect(matchDetails.lagoonProjectName).toEqual("projectname-here")
    expect(matchDetails.lagoonEnvironmentName).toEqual("environmentname-here")
    expect(matchDetails.lagoonServiceName).toEqual("servicename-here")
})