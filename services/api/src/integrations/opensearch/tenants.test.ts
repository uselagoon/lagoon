import {
  isGlobalTenant,
  notGlobalTenant,
  generateTenantPayload
} from './tenants';

test('isGlobalTenant', () => {
  expect(isGlobalTenant('global_tenant')).toBeTruthy();
  expect(isGlobalTenant('globaltenant')).toBeFalsy();
  expect(isGlobalTenant('global')).toBeFalsy();
  expect(isGlobalTenant('high-cotton')).toBeFalsy();
});

test('notGlobalTenant', () => {
  expect(notGlobalTenant('global_tenant')).toBeFalsy();
  expect(notGlobalTenant('globaltenant')).toBeTruthy();
  expect(notGlobalTenant('global')).toBeTruthy();
  expect(notGlobalTenant('high-cotton')).toBeTruthy();
});

test('generateTenantPayload', () => {
  expect(generateTenantPayload('high-cotton')).toStrictEqual({
    body: {
      description: 'high-cotton'
    }
  });
});
