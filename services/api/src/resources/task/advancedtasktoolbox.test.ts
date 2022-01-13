import { IKeycloakAuthAttributes, KeycloakUnauthorizedError } from '../../util/auth';
import * as R from 'ramda';
import { deploymentSubscriber } from '../deployment/resolvers';


interface IPermissionsMockItem {
    resource: string,
    scope: string,
    attributes: IKeycloakAuthAttributes
}

const areIKeycloakAuthAttributesEqual = (a: IKeycloakAuthAttributes, b: IKeycloakAuthAttributes) => {
    return R.symmetricDifference(a.users, b.users).length == 0 && a.group == b.group && a.project == b.project;
}

//TODO: can we leverage Jest to actually do this?
//Mock out the hasPermissions function
// requires sets of `resource, scope, attributes: IKeycloakAuthAttributes = {}` to define permissions
const mockHasPermission = (permissions: Array<IPermissionsMockItem>) => {
    return async (resource, scope, attributes: IKeycloakAuthAttributes = {}) => {
        let match = false;
        permissions.forEach(element => {
            if(element.resource == resource &&
                scope == element.scope
                && areIKeycloakAuthAttributesEqual(element.attributes, attributes)
                ) {
                match = true;
            }
        });
        if(match) { return true; }

        throw new KeycloakUnauthorizedError(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
    }
}

//Let's quickly ensure our test functions are working as expected
describe('testSystemsMetaTest', () => {
    const usersPermissions = [
        {resource: 'task', scope: 'view', attributes: {users: [1,2,3]}},
        {resource: 'nothing', scope: 'whatever', attributes: {}},
    ];

    test('should match our users permissions when running haspermissions', () => {
        let hasPermission = mockHasPermission(usersPermissions);
        return expect(hasPermission('task', 'view', {users: [2,1,3]})).resolves.toBe(true);
    });
});


describe('advancedtasktoolbox', () => {
    describe('Permissions functionality', () => {



    });
});

//Mock out the query function on the sqlClientPool Object

