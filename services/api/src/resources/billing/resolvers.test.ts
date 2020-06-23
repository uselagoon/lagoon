/*
    To run all tests here, execute the following command:
    $ cd services/api && yarn install

    $ yarn test billingModifiers

    To run a specific test and watch for changes, you can use the tags at the end of the description.

    Example:
    $ yarn test:watch billingModifiers--colors -t "#create, #read"
*/

import { random, date } from 'faker';
import moment from 'moment';
import {
  initializeGraphQL,
  addBillingModifier,
  allBillingModifiers,
  updateBillingModifier,
  deleteBillingModifier,
  deleteAllBillingModifiers,
  addBillingGroup
} from './graphql';
import {
  BillingModifierInput,
} from './resolvers';
import { BillingGroup } from '../../models/group';

export const defaultModifier: BillingModifierInput = {
  group: { name: 'High Cotton Billing Group' },
  startDate: moment()
    .format('MM-DD-YYYY')
    .toString(),
  endDate: moment()
    .add(1, 'M')
    .format('MM-DD-YYYY')
    .toString(),
  discountFixed: 100,
  discountPercentage: 0,
  extraFixed: 0,
  extraPercentage: 0,
  min: 0,
  max: 0,
  customerComments: 'xxx',
  adminComments: 'xxx'
};

export const defaultBillingGroup: BillingGroup = {
  name: 'PLACEHOLDER',
  currency: 'USD',
  billingSoftware: 'Bexio'
};

// Unit Under Test
describe('Billing Modifiers', () => {
  // const cleanup: number[] = [];
  beforeAll(async () => {
    await initializeGraphQL();
  });

  afterEach(async () => {
    await deleteAllBillingModifiers({ name: defaultBillingGroup.name })
    await deleteAllBillingModifiers({ name: defaultModifier.group.name })
  }, 50000);

  describe('CRUD', () => {
    // scenarios and expectation
    it('When I create a modifier via a graphql mutation, I expect it to be saved to the database. #create, #read', async () => {
      // Arrange
      const {
        customerComments: expectedCustomerComments,
        adminComments: expectedAdminComments
      } = defaultModifier;

      // Act
      const { data } = await addBillingModifier(defaultModifier);

      if (!data.data.addBillingModifier) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: {
          addBillingModifier: {
            id,
            group,
            discountFixed,
            customerComments,
            adminComments
          }
        }
      } = data;

      // Assert
      expect(id).toBeDefined();
      expect(group.id).toBeDefined();
      expect(discountFixed).toBe(100);
      expect(customerComments).toBe(expectedCustomerComments);
      expect(adminComments).toBe(expectedAdminComments);
    });

    it('When I query for all modifiers for a given billing group, I expect it the returned. #query #read', async () => {
      // Arrange
      const { group, startDate, endDate } = defaultModifier;

      const {
        data: {
          data: {
            addBillingModifier: { id }
          }
        }
      } = await addBillingModifier(defaultModifier);

      // Act
      const { data } = await allBillingModifiers({
        name: 'High Cotton Billing Group'
      });

      if (!data.data.allBillingModifiers) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: { allBillingModifiers: result }
      } = data;
      const last = result.length - 1;

      // Assert
      expect(result).not.toBeUndefined();
      expect(result.length).toBeGreaterThan(0);

      const modifier = result[last];
      expect(modifier.group.id).not.toBeUndefined();
      expect(modifier.group.name).toBe(group.name);
      expect(modifier.discountFixed).toBe(100);
      expect(modifier.discountPercentage).toBe(0);
      expect(modifier.extraFixed).toBe(0);
      expect(modifier.extraPercentage).toBe(0);
      expect(modifier.customerComments).toBe('xxx');
      expect(modifier.adminComments).toBe('xxx');

      const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
      const expectedStartDate = moment(new Date(startDate).toISOString())
        .format(DATE_FORMAT)
        .toString();
      expect(modifier.startDate).toBe(expectedStartDate);
      const expectedEndDate = moment(new Date(endDate).toISOString())
        .format(DATE_FORMAT)
        .toString();
      expect(modifier.endDate).toBe(expectedEndDate);
    });

    it('When I query for a modifier for a specific billing group that is known to not have any modifiers, I expect an empty array to be returned. #read, #empty', async () => {
      // Arrange
      // Add new billing Group
      const name = random.alphaNumeric(10);
      const { data: billingGroupData } = await addBillingGroup({
        ...defaultBillingGroup,
        name
      });

      if (!billingGroupData.data.addBillingGroup) {
        throw new Error(billingGroupData.errors[0].message);
      }

      // Act
      const { data } = await allBillingModifiers({ name });

      if (!data.data.allBillingModifiers) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: { allBillingModifiers: result }
      } = data;

      // Assert
      expect(result.length).toBe(0);
    }, 60000);

    it('When I query for a modifier with the (month filter set), I expect only modifiers that are active during that month to be returned. #read, #filter', async () => {
      // Arrange
      const {
        data: {
          data: {
            addBillingModifier: { id }
          }
        }
      } = await addBillingModifier({
        ...defaultModifier,
        startDate: '05-10-1978',
        endDate: '06-10-1978'
      });

      // Act
      const { data } = await allBillingModifiers(
        { name: defaultModifier.group.name },
        '05-10-1978'
      );
      if (!data.data.allBillingModifiers) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: { allBillingModifiers: result }
      } = data;

      // Assert
      expect(result.length).toBeGreaterThan(0);
    }, 50000);

    it('When I query for a modifier with the (month filter undefined), I expect all modifiers that to be returned, historical and future', async () => {
      // Arrange
      const {
        data: {
          data: {
            addBillingModifier: { id: id1 }
          }
        }
      } = await addBillingModifier({
        ...defaultModifier,
        startDate: '11-19-2013',
        endDate: '11-19-2019'
      });
      const {
        data: {
          data: {
            addBillingModifier: { id: id2 }
          }
        }
      } = await addBillingModifier({
        ...defaultModifier,
        startDate: '04-10-2016',
        endDate: '04-10-2017'
      });

      // Act
      const { data } = await allBillingModifiers({
        name: defaultModifier.group.name
      });
      if (!data.data.allBillingModifiers) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: { allBillingModifiers: result }
      } = data;

      // Assert
      expect(result.length).toBeGreaterThan(0);
    });

    it('When I update a modifier via a graphql mutation, I expect the updates to be saved in the database. #add #update', async () => {
      // Arrange
      const addedModifier = await addBillingModifier({
        ...defaultModifier,
        startDate: '11-19-2013',
        endDate: '05-10-2020'
      });
      const {
        data: {
          data: {
            addBillingModifier: { id }
          }
        }
      } = addedModifier;

      // Act
      const updatedStartDate = '11-19-2015';
      const { data } = await updateBillingModifier(id, {
        startDate: updatedStartDate
      });
      if (!data.data.updateBillingModifier) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: { updateBillingModifier: result }
      } = data;

      const DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';
      const expectedStartDate = moment(new Date(updatedStartDate).toISOString())
        .format(DATE_FORMAT)
        .toString();

      // Assert
      expect(result).not.toBeUndefined();
      expect(result.startDate).toBe(expectedStartDate);
    });

    it('When I delete a modifier via a graphql mutation, I expect the modifier to be removed from the databvase. #mutation, #delete', async () => {
      // Arrange
      const group = { name: 'High Cotton Billing Group' };
      const startDate = moment()
        .format('MM-DD-YYYY')
        .toString();
      const endDate = moment()
        .add(1, 'M')
        .format('MM-DD-YYYY')
        .toString();

      const {
        data: {
          data: {
            addBillingModifier: { id }
          }
        }
      } = await addBillingModifier({
        group,
        startDate,
        endDate,
        discountFixed: 100,
        discountPercentage: 0,
        extraFixed: 0,
        extraPercentage: 0,
        customerComments: 'xxx',
        adminComments: 'xxx'
      });

      // Act
      const { data } = await deleteBillingModifier(id);

      if (!data.data.deleteBillingModifier) {
        throw new Error(data.errors[0].message);
      }

      const {
        data: { deleteBillingModifier: result }
      } = data;

      // Assert
      expect(result).toBeDefined();
    });
  });
}); // End Billing Calculations
