import { EnvironmentModel } from "./environment";

import aLegacy from "./mockHitDataLegacy-project-a.json";
import aLegacyMissingData from "./mockHitDataLegacy-project-a-missing-data.json";
import bNew from "./mockHitDataNew-project-b.json";
import bNewMissingData from "./mockHitDataNew-project-b-missing-data.json";
import cLegacyPartial from "./mockHitDataLegacy-project-c.json";
import cNewPartial from "./mockHitDataNew-project-c.json"


import legacyData from "./legacy.json";
import newData from "./new.json";

import esClient from '../clients/esClient';

const zeroOutBuckets = (mockResult) => {
  return {
    ...mockResult,
    hits: { total: {value : 0 }},
    aggregations: {
      hourly : {
        buckets : mockResult.aggregations.hourly.buckets.map(bucket => ({
          ...bucket,
          count: { value: 0 }
        }))
      },
      average : {
        value : 0
      }
    }
  }
}


const legacyHitsMonthByEnvironmentId = (result) => {

  // 0 hits found in elasticsearch, don't even try to generate monthly counts
  if (result.hits.total.value === 0) {
    return { total: 0 };
  }

  var total = 0;

  // loop through all hourly sum counts
  // if the sum count is empty, this means we have missing data and we use the overall average instead.
  result.aggregations.hourly.buckets.forEach(bucket => {
    total += (bucket.count.value === 0 ? parseInt(result.aggregations.average.value) : bucket.count.value);
  });

  return { total };
};



// Unit Under Test
describe('Environment Data', () => {

  describe('Hits', () => {

    it('When calculating hits, it should match legacy numbers #calculations', async () => {

      const environmentModel = EnvironmentModel({esClient});

      const legacyCalculations = legacyHitsMonthByEnvironmentId(legacyData);
      const newCalculations = environmentModel.calculateHitsFromESData(legacyData, newData)

      console.log(`legacy: ${legacyCalculations.total} new: ${newCalculations.total}`)

      expect(newCalculations.total).toBe(legacyCalculations.total);
    })

    // scenarios and expectation
    it('When using the legacy logging system, with all Sept hourly buckets total set to 10, then the hits should be 7200 #legacy #logging', async () => {
      // Arrange
      const environmentModel = EnvironmentModel({esClient});
      const openshiftProjectName = "test-legacy-prod";
      const month = "2020-09"
      const projectName = "test-legacy"
      esClient.search = async (obj) => {
        // new query request - return empty object
        if(obj.index === `router-logs-${projectName}-_-*`){
          return zeroOutBuckets(aLegacy);
        }
        return aLegacy;
      }

      // Act
      const hits = await environmentModel.environmentHitsMonthByEnvironmentId(projectName, openshiftProjectName, month);

      // Assert
      expect(hits.total).toBe(7200);
    });

    // scenarios and expectation
    it('When using the legacy logging system, with missing data (20 Sept hourly buckets set to zero) (720 total buckets set to 10), then the hits should be 7200 #legacy #logging #missing-data', async () => {
      // Arrange
      const environmentModel = EnvironmentModel({esClient});
      const openshiftProjectName = "test-legacy-prod";
      const month = "2020-09"
      const projectName = "test-legacy"
      esClient.search = async (obj) => {
        // new query request - return empty object
        if(obj.index === `router-logs-${projectName}-_-*`){
          return zeroOutBuckets(aLegacyMissingData);
        }
        return aLegacyMissingData;
      }

      // Act
      const hits = await environmentModel.environmentHitsMonthByEnvironmentId(projectName, openshiftProjectName, month);

      // Assert
      expect(hits.total).toBe(7200);
    });

    // scenarios and expectation
    it('When using the new logging system, with all Sept 2020 hourly buckets total set to 2, then the hits should be 1440 #new #logging', async () => {
      // Arrange
      const environmentModel = EnvironmentModel({esClient});
      const openshiftProjectName = "test-prod";
      const month = "2020-09"
      const projectName = "test"
      esClient.search = async (obj) => {
        // legacy query request - return empty object
        if(obj.index === `router-logs-${openshiftProjectName}-*`){
          return zeroOutBuckets(bNew);
        }
        return bNew;
      }

      // Act
      const hits = await environmentModel.environmentHitsMonthByEnvironmentId(projectName, openshiftProjectName, month);

      // Assert
      expect(hits.total).toBe(1440);
    });

    // scenarios and expectation
    it('When using the new logging system, with missing data,  (20 Sept hourly buckets set to zero) (720 total buckets set to 2), then the hits should be 1440 #new #logging #missing-data', async () => {
      // Arrange
      const environmentModel = EnvironmentModel({esClient});
      const openshiftProjectName = "test-prod";
      const month = "2020-09"
      const projectName = "test"
      esClient.search = async (obj) => {
        // legacy query request - return empty object
        if(obj.index === `router-logs-${openshiftProjectName}-*`){
          return zeroOutBuckets(bNewMissingData);
        }
        return bNewMissingData;
      }

      // Act
      const hits = await environmentModel.environmentHitsMonthByEnvironmentId(projectName, openshiftProjectName, month);

      // Assert
      expect(hits.total).toBe(1440);
    });


    // scenarios and expectation
    it('When a project uses both the new and legacy logging system, then the hits should be 7200 #partial #new #legacy #logging', async () => {
      // Arrange
      const openshiftProjectName = "test-partial-prod";
      esClient.search = async (obj) => {
        if (obj.index === `router-logs-${openshiftProjectName}-*`){
          return cLegacyPartial;
        }
        if (obj.index === `router-logs-${projectName}-_-*`){
          return cNewPartial;
        }
        return {}
      }
      const environmentModel = EnvironmentModel({esClient});
      const month = "2020-09"
      const projectName = "test"

      // Act
      const hits = await environmentModel.environmentHitsMonthByEnvironmentId(projectName, openshiftProjectName, month);

      // Assert
      expect(hits.total).toBe(7200);
    });



  });

}); // End Unit Under Test