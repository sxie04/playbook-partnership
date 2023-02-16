import { SQL, Table } from '@/spec/sql'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { z_uuid } from '@/utils/zod'

const event_type = z.enum(['alter', 'create', 'visit'])
export const event_type_enum = SQL.create()
  .up(`
    create type event_type as enum (
      'alter',
      'create',
      'visit'
    );
  `)
  .down(`
    drop type event_type cascade;
  `)
  .build()

export const fpl_event = Table.create('fpl_event')
  .field('id', 'uuid', 'default uuid_generate_v4()', z_uuid(), { primaryKey: true, default: uuidv4 })
  .field('user', 'uuid', 'references "user" ("id") on delete cascade default null', z_uuid().nullable())
  .field('fpl', 'uuid', 'not null references "fpl" ("id") on delete cascade', z_uuid())
  .field('event', 'event_type', 'not null', event_type)
  .field('created', 'timestamp', 'not null default now()', z.date(), { default: () => new Date() })
  .build()
