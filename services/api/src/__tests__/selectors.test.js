// @flow


const { getAllSiteGroups } = require('../selectors'); 


describe('getAllSiteGroups', () => {
  test('should return a list of getAllSiteGroups', () => {
    const state = {
      siteGroups: {
        sg1: { gitUrl: 'git://sg1' },
        sg2: { gitUrl: 'git://sg2' },
      },
    };

    const ret = getAllSiteGroups(state);

    expect(ret).toMatchSnapshot();
  });
});
