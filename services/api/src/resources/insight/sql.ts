import { knex } from '../../util/db';

export const Sql = {
	selectInsightId: (id: number) =>
		knex('insight')
			.where('id', '=', id)
			.toString(),
};
