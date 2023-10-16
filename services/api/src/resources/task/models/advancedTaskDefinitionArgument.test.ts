import { AdvancedTaskArgumentValidator, NumberArgument, EnvironmentSourceArgument, OtherEnvironmentSourceNamesArgument, StringArgument } from "./advancedTaskDefinitionArgument";

describe("Testing AdvancedTaskArgumentValidator class as a whole", () => {

    let arglist = [
        { name: "stringarg", type: StringArgument.typeName(), range: "", default: "" },
        { name: "envarg", type: EnvironmentSourceArgument.typeName(), range: "", default: "" },
    ];

    let environmentNames = ["main", "dev", "qa"];

    let myEnvironmentName = "main";

    let advancedTaskValidator = new AdvancedTaskArgumentValidator(1, myEnvironmentName, environmentNames, arglist);

    test("string validator", () => {
        return expect(advancedTaskValidator.validateArgument("stringarg", "arbitrary string")).toBe(true);
    });

    test("environment source argument validator", () => {
        return expect(advancedTaskValidator.validateArgument("envarg", "dev")).toBe(true);
    });

    test("environment source argument validator - not in list", () => {
        return expect(advancedTaskValidator.validateArgument("envarg", "notInEnvList")).toBe(false);
    });

});

describe("advanced task def arguments individual validator tests", () => {

    test("numeric validator", () => {
        let validator = new NumberArgument();
        return expect(validator.validateInput("5")).toBe(true);
    });


    let environmentSourceArgument = new EnvironmentSourceArgument(["a", "b", "c"]);
    test("EnvironmentSourceArgument with valid input", () => {
        return expect(environmentSourceArgument.validateInput("a")).toBe(true);
    });

    test("EnvironmentSourceArgument with invalid input", () => {
        return expect(environmentSourceArgument.validateInput("not-in-env-list")).toBe(false);
    });

    let otherEnvironmentSourceNamesArgument = new OtherEnvironmentSourceNamesArgument("myname", ["myname", "dev", "qa", "main"]);
    test("OtherEnvironmentSourceNamesArgument test name that isn't mine is valid", () => {
        return expect(otherEnvironmentSourceNamesArgument.validateInput("main")).toBe(true);
    });

    test("OtherEnvironmentSourceNamesArgument test name that is mine is invalid", () => {
        // since this should filter all environments _except_ the target, this should fail
        return expect(otherEnvironmentSourceNamesArgument.validateInput("myname")).toBe(false);
    });

});