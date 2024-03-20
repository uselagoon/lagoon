import { waitForKeycloak } from '../../util/waitForKeycloak';
import { envHasConfig } from '../../util/config';
import { logger } from '../../loggers/logger';
import { migrate } from '../../util/db'


(async () => {
    await waitForKeycloak();

    // run any migrations that need keycloak before starting the api
    try {
        // run the migrations
        logger.info('previous migrations:');
        const before = await migrate.migrate.list();
        for (const l of before) {
            if (l.length) {
                logger.info(`- ${l.name}`)
            }
        }
        logger.info('performing migrations if required');
        // actually run the migrations
        await migrate.migrate.latest();
        logger.info('migrations completed');
    } catch (e) {
        logger.fatal(`Couldn't run migrations: ${e.message}`);
        process.exit(1)
    }

    process.exit()
})();
