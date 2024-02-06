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
    const userSort = R.partial(R.sort, [(a, b) => { return a - b; }]);
    return R.equals(a.project, b.project) && R.equals(a.group, b.group) &&
        R.equals(userSort(a.users || []), userSort(b.users || []));
}

//Mock out the hasPermissions function
// requires sets of `resource, scope, attributes: IKeycloakAuthAttributes = {}` to define permissions
const mockHasPermission = (permissions: Array<IPermissionsMockItem>) => {
    return async (resource, scope, attributes: IKeycloakAuthAttributes = {}) => {
        let match = false;
        permissions.forEach(element => {
            if (element.resource == resource &&
                scope == element.scope &&
                areIKeycloakAuthAttributesEqual(element.attributes, attributes)
            ) {
                match = true;
            }
        });
        if (match) { return true; }
        throw new KeycloakUnauthorizedError(`Unauthorized: You don't have permission to "${scope}" on "${resource}".`);
    }
}



describe('advancedtasktoolbox', () => {
    describe('canUserSeeTaskDefinition', () => {

        let environmentById = jest.fn((id: number) => {
            if (id == 1) {
                return { project: 1 };
            }
            return { project: 2 };
        });

        let environmentHelpers = {
            getEnvironmentById: environmentById,
        };

        //This user has permission to view tasks on
        let hasPermissions = mockHasPermission([{ resource: 'task', scope: 'view', attributes: { project: 1 } }])
        let ath = advancedTaskFunctionFactory({}, hasPermissions, {}, {}, environmentHelpers, {});

        test('test user is granted permission when invoking a project she has access to', () => {
            return expect(ath.permissions.canUserSeeTaskDefinition({ environment: 1 })).resolves.toBe(true);
        });

        test('test user is denied permission to a project she doesnt have access to', () => {
            return expect(ath.permissions.canUserSeeTaskDefinition({ environment: 2 })).resolves.toBe(false);
        });
    });
});


//Let's quickly ensure our test functions are working as expected
describe('testSystemsMetaTest', () => {
    const usersPermissions = [
        { resource: 'task', scope: 'view', attributes: { users: [1, 2, 3] } },
        { resource: 'nothing', scope: 'whatever', attributes: {} },
    ];

    test('should match our users permissions when running haspermissions', () => {
        let hasPermission = mockHasPermission(usersPermissions);
        return expect(hasPermission('task', 'view', { users: [2, 1, 3] })).resolves.toBe(true);
    });
});
