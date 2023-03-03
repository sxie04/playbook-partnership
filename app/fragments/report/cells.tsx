import React from 'react'
import dynamic from 'next/dynamic'
import type { FPL } from '@/core/FPPRG'
import type KRG from '@/core/KRG'
import Link from 'next/link'
import { view_in_graph_icon, fork_icon, start_icon } from '@/icons'
import { useSWRImmutableSticky } from '@/utils/use-sticky'

const ShareButton = dynamic(() => import('@/app/fragments/report/share-button'))
const Cell = dynamic(() => import('@/app/fragments/report/cell'))
const EditableText = dynamic(() => import('@blueprintjs/core').then(({ EditableText }) => EditableText))
const Icon = dynamic(() => import('@/app/components/icon'))

type Metapath = ReturnType<FPL['toJSON']>

export default function Cells({ krg, id }: { krg: KRG, id: string }) {
  const { data: metapath, error } = useSWRImmutableSticky<Array<Metapath>>(id ? `/api/db/fpl/${id}` : undefined)
  const [metadata, setMetadata] = React.useState({ title: '', description: '', public: false })
  const head = metapath ? metapath[metapath.length - 1] : undefined
  const processNode = head ? krg.getProcessNode(head.process.type) : undefined
  return (
    <div className="flex flex-col py-4 gap-2">
      <div className="flex-grow flex-shrink bp4-card p-0">
        <div className="p-3">
          <div className="flex flex-row gap-2">
            <Icon icon={start_icon} />
            <h2 className="bp4-heading">
              <EditableText
                placeholder="Playbook title"
                value={metadata.title}
                onChange={value => {setMetadata(metadata => ({ ...metadata, title: value }))}}
              />
            </h2>
          </div>
          <p className="prose w-full">
            <EditableText
              multiline
              minLines={2}
              maxLines={5}
              placeholder={
                processNode ?
                  metapath ?
                    metapath.length > 1 ?
                      `A playbook which produces ${processNode.output.meta.label} given a ${krg.getProcessNode(metapath[0].process.type).output.meta.label}.`
                      : `A playbook which takes a ${krg.getProcessNode(metapath[0].process.type).output.meta.label}.`
                    : `A playbook`
                  : `A playbook`
              }
              value={metadata.description}
              onChange={value => {setMetadata(metadata => ({ ...metadata, description: value }))}}
            />
          </p>
          {metadata.title || metadata.description ? (
            <div className="flex flex-row gap-2 items-center">
              <button className="bp4-button bp4-intent-success">Save</button>
              <label className="bp4-control bp4-switch mb-0">
                <input
                  type="checkbox"
                />
                <span className="bp4-control-indicator"></span>
                Make workflow public
              </label>
            </div>
          ) : null}
        </div>
        {error ? <div className="alert alert-error">{error}</div> : null}
        <div className="border-t-secondary border-t-2 mt-2">
          <Link href={`/graph${id ? `/${id}/node/start` : ``}`}>
            <button className="bp4-button bp4-minimal">
              <Icon icon={view_in_graph_icon} />
            </button>
          </Link>
          <Link href={`/graph${id ? `/${id}/node/start/extend` : `/start/extend`}`}>
            <button className="bp4-button bp4-minimal">
              <Icon icon={fork_icon} color="black" />
            </button>
          </Link>
          <ShareButton id={id} />
        </div>
      </div>
      {(metapath||[]).map((head, index) =>
        <Cell key={index} krg={krg} index={index} id={id} head={head} />
      )}
    </div>
  )
}
