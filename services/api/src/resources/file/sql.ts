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
};
