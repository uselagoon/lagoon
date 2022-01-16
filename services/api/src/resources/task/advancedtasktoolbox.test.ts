import { IKeycloakAuthAttributes, KeycloakUnauthorizedError } from '../../util/auth';
import * as R from 'ramda';
import { deploymentSubscriber } from '../deployment/resolvers';
import { advancedTaskFunctionFactory } from './advancedtasktoolbox';
import { sqlClientPool } from '../../clients/sqlClient';


interface IPermissionsMockItem {
    resource: string,
    scope: string,
    attributes: IKeycloakAuthAttributes
}

const areIKeycloakAuthAttributesEqual = (a: IKeycloakAuthAttributes, b: IKeycloakAuthAttributes) => {
    return (a.users && b.users && R.symmetricDifference(a.users, b.users).length == 0)
           && (a.group && b.group && a.group == b.group) && (a.project && b.project && a.project == b.project);
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
                // && areIKeycloakAuthAttributesEqual(element.attributes, attributes)
                ) {
                match = true;
            }
        });
        if(match) { return true; }
        throw new KeycloakUnauthorizedError(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
    }
}



describe('advancedtasktoolbox', () => {
    describe('canUserSeeTaskDefinition', () => {

        let environmentById = jest.fn((id: number) => {
            return {project: 1};
        });

        let environmentHelpers = {
            getEnvironmentById: environmentById,
        };


        //This user has permission to view tasks on
        let hasPermissions = mockHasPermission([{resource: 'task', scope: 'view', attributes: {project: 1}}])
        let ath = advancedTaskFunctionFactory({}, hasPermissions, {}, environmentHelpers, {});

        test('test user is granted permission when invoking a project she has access to', () => {
            return expect(ath.canUserSeeTaskDefinition({environment: 1})).resolves.toBe(true);
        });
    });
});


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
