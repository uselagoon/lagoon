import {TaskRegistration, newTaskRegistrationFromObject} from './taskRegistration'

test("newTaskRegistrationFromObject returns a filled TaskRegistration object", () => {
    let payloadData = {
        type: "STANDARD",
        environment: 5,
        command: "command here"
    }

    let retObject = newTaskRegistrationFromObject(payloadData)
    expect(retObject.type).toEqual("STANDARD")

})