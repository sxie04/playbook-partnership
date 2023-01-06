import { Data, Database, Process, Resolved } from '@/core/FPPRG'
import KRG from '@/core/KRG'
import * as dict from '@/utils/dict'
import PgBoss from 'pg-boss'
import { PgDatabase } from '@/core/FPPRG'

class UnboundError extends Error {}

/**
 * Given an instanceProcess, "resolve" its output, this is typically done
 *  by executing it, though prompts are implicitly identity functions.
 */
export async function resolve_process(krg: KRG, instanceProcess: Process) {
  try {
    const metaProcess = krg.getProcessNode(instanceProcess.type)
    if (metaProcess === undefined) throw new Error('Unrecognized process')
    const props = {
      data: instanceProcess.data,
      inputs: dict.init(
        dict.items(await instanceProcess.inputs__outputs()).map(({ key, value }) => {
          if (value === undefined) {
            // handle nodes
            throw new UnboundError()
          } else if (value.type === 'Error') {
            // propagate errors
            throw new Error(`${instanceProcess.type} can't run because of error in ${metaProcess.inputs[key as string].spec}`)
          }
          return { key, value: value ? metaProcess.inputs[key as string].codec.decode(value.value) : undefined }
      })),
    }
    if ('prompt' in metaProcess) {
      console.debug(`Output comes from data`)
      return new Resolved(instanceProcess, instanceProcess.data)
    } else {
      const output = metaProcess.output.codec.encode(await metaProcess.resolve(props))
      console.debug(`Calling action ${JSON.stringify(metaProcess.spec)} with props ${JSON.stringify(props)} of type ${JSON.stringify(metaProcess.inputs)} to produce ${JSON.stringify(metaProcess.output.spec)}: ${output}`)
      return new Resolved(instanceProcess, new Data(metaProcess.output.spec, output))
    }
  } catch (e) {
    if (e instanceof UnboundError) {
      return new Resolved(instanceProcess, undefined)
    } else {
      console.error(e)
      return new Resolved(instanceProcess, new Data('Error', JSON.stringify((e as Error).toString())))
    }
  }
}

/**
 * This is a minimally viable scg engine -- given a database,
 *  we'll reconcile process outputs when they are created.
 */
export function process_insertion_dispatch(krg: KRG, db: Database) {
  return db.listen(async (table, record) => {
    if (table === 'process') {
      const instanceProcess = record as Process
      const resolved = await resolve_process(krg, instanceProcess)
      await db.upsertResolved(resolved)
    }
  })
}

/**
 * This worker receives jobs from the boss work-queue which ensures
 *  submitted jobs are given to one and only one worker. This should
 *  be run with several replicas in production.
 */
export function start_workers(n_workers: number) {
  if (!process.env.DATABASE_URL) throw new Error('Missing `DATABASE_URL`')
  const boss = new PgBoss(process.env.DATABASE_URL)
  const db = new PgDatabase(process.env.DATABASE_URL)
  const krg = new KRG()
  boss.on('error', error => console.error(error))
  ;(async () => {
    await boss.start()
    await boss.work('work-queue', { teamSize: n_workers, teamConcurrency: n_workers }, async (job) => {
      // the job.data should contain the process id
      const processId = job.data as string
      console.log(`Processing ${processId}...`)
      // we fetch it from the db
      const instanceProcess = await db.getProcess(job.data as string)
      if (!instanceProcess) throw new Error(`Process ${job.data} not found`)
      if (instanceProcess.resolved === undefined) {
        // resolve the process
        const resolved = await resolve_process(krg, instanceProcess)
        // store the result in the db
        await db.upsertResolved(resolved)
      }
    })
  })().catch(error => console.error(error))
  return () => {
    boss.stop().catch(error => console.error(error))
  }
}
