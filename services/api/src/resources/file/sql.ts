import { knex } from '../../util/db';

export const Sql = {
  selectTaskFiles: (tid: number) =>
    knex('task_file')
      .join('s3_file', 'task_file.fid', '=', 's3_file.id')
      .where('task_file.tid', tid)
      .andWhere('s3_file.deleted', '0000-00-00 00:00:00')
      .orderBy('s3_file.created', 'desc')
      .toString(),
  insertFile: ({
    id,
    filename,
    s3_key,
    created,
  }: {
    id?: number,
    filename: string,
    s3_key: string,
    created: string,
  }) =>
    knex('s3_file')
      .insert({
        id,
        filename,
        s3_key,
        created,
      })
      .toString(),
  insertFileTask: ({
    tid,
    fid,
  }: {
    tid: number,
    fid: number,
  }) =>
    knex('task_file')
      .insert({
        tid,
        fid,
      })
      .toString(),
  deleteFileTask: (id: number) =>
    knex('s3_file')
      .join('task_file', 's3_file.id', '=', 'task_file.fid')
      .where('task_file.tid', id)
      .andWhere('s3_file.deleted', '0000-00-00 00:00:00')
      .update({
        's3_file.deleted': knex.fn.now(),
      })
      .toString(),
  selectInsightFiles: (iid: number) =>
    knex('insight_file')
      .join('s3_file', 'insight_file.fid', '=', 's3_file.id')
      .where('insight_file.iid', iid)
      .andWhere('s3_file.deleted', '0000-00-00 00:00:00')
      .orderBy('s3_file.created', 'desc')
      .toString(),
  insertFileInsight: ({
    iid,
    fid,
  }: {
    iid: number,
    fid: number,
  }) =>
    knex('insight_file')
      .insert({
        iid,
        fid,
      })
      .toString(),
  deleteFileInsight: (id: number) =>
    knex('s3_file')
      .join('insight_file', 's3_file.id', '=', 'insight_file.fid')
      .where('insight_file.iid', id)
      .andWhere('s3_file.deleted', '0000-00-00 00:00:00')
      .update({
        's3_file.deleted': knex.fn.now(),
      })
      .toString(),
};
