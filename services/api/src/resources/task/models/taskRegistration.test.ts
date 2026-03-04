import { newTaskRegistrationFromObject } from './taskRegistration';

test('newTaskRegistrationFromObject returns a filled TaskRegistration object', () => {
  const payloadData = {
    type: 'STANDARD',
    environment: 5,
    command: 'command here',
  };

  const retObject = newTaskRegistrationFromObject(payloadData);
  expect(retObject.type).toEqual('STANDARD');
});
