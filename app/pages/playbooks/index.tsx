import React from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { view_report_icon } from '@/icons'
import Link from 'next/link'
import * as dict from '@/utils/dict'
import * as array from '@/utils/array'
import { DataMetaNode } from '@/spec/metanode'
import useAsyncEffect from 'use-async-effect'

const Icon = dynamic(() => import('@/app/components/icon'))
const Header = dynamic(() => import('@/app/fragments/playbook/header'))
const Footer = dynamic(() => import('@/app/fragments/playbook/footer'))

type Playbook = {
  id: string,
  label: string,
  description: string,
  url: string,
  dataSources: string[],
  inputs: Array<DataMetaNode>,
  outputs: Array<DataMetaNode>,
}

export default function Playbooks() {
  const [dataSourceFilters, setDataSourceFilters] = React.useState<Record<string, boolean>>({})
  const [inputFilters, setInputFilters] = React.useState<Record<string, boolean>>({})
  const [outputFilters, setOutputFilters] = React.useState<Record<string, boolean>>({})
  const [playbooks, setPlaybooks] = React.useState<Array<Playbook>>()
  const { allInputs, allOutputs, allDataSources, isLoading } = React.useMemo(() => {
    const allInputs: Record<string, DataMetaNode> = {}
    const allOutputs: Record<string, DataMetaNode> = {}
    const allDataSources: Record<string, string> = {}
    let isLoading = true
    if (playbooks) {
      playbooks.forEach(playbook => {
        playbook.inputs.forEach(input => {
          allInputs[input.spec] = input as DataMetaNode
        })
        playbook.outputs.forEach(output => {
          allOutputs[output.spec] = output as DataMetaNode
        })
        playbook.dataSources.forEach(dataSource => {
          allDataSources[dataSource] = dataSource
        })
      })
      isLoading = false
    }
    return { allInputs, allOutputs, allDataSources, isLoading }
  }, [playbooks])
  useAsyncEffect(async (isMounted) => {
    const { default: demoPlaybooks } = await import('@/app/public/playbooksDemo')
    if (!isMounted()) return
    setPlaybooks(demoPlaybooks as Array<Playbook>)
  }, [])
  return (
    <div className="flex flex-col min-w-screen min-h-screen">
      <Head>
        <title>Playbooks</title>
      </Head>

      <Header />

      <main className="flex-grow container mx-auto py-4 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2">
            <div className="prose"><h2>Data Sources</h2></div>
            <div className="flex flex-row flex-wrap gap-2">
              {dict.values(allDataSources).map(dataSource => (
                <button
                  key={dataSource}
                  onClick={() => {
                    setDataSourceFilters(({ [dataSource]: cur, ...filters }) => {
                      if (!cur) return {...filters, [dataSource]: !cur}
                      else return filters
                    })
                  }}
                  className={`underline ${dataSourceFilters[dataSource] ? 'font-bold' : ''}`}
                >
                  {dataSource}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-row gap-2">
            <div className="flex-grow flex flex-col gap-2">
              <div className="prose"><h2>Inputs</h2></div>
              <div className="flex flex-row flex-wrap gap-2">
                {dict.values(allInputs).map(input => (
                  <button
                    key={input.spec}
                    onClick={() => {
                      setInputFilters(({ [input.spec]: cur, ...filters }) => {
                        if (!cur) return {...filters, [input.spec]: !cur}
                        else return filters
                      })
                    }}
                  >
                    <Icon
                      container="circle"
                      container_color={inputFilters[input.spec] ? '#B3CFFF' : '#ddd'}
                      size={1.5}
                      icon={input.meta.icon}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-grow flex flex-col gap-2">
              <div className="prose"><h2>Outputs</h2></div>
              <div className="flex flex-row flex-wrap gap-2">
                {dict.values(allOutputs).map(output => (
                  <button
                    key={output.spec}
                    onClick={() => {
                      setOutputFilters(({ [output.spec]: cur, ...filters }) => {
                        if (!cur) return {...filters, [output.spec]: !cur}
                        else return filters
                      })
                    }}
                  >
                    <Icon
                      key={output.spec}
                      container="circle"
                      container_color={outputFilters[output.spec] ? '#B3CFFF' : '#ddd'}
                      size={1.5}
                      icon={output.meta.icon}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div>
          <table className="table w-full">
            <thead>
              <tr>
                <th>Playbook</th>
                <th className="text-center">Inputs</th>
                <th className="text-center">Outputs</th>
                <th className="text-center">Sources</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ?
                <tr>
                  <td colSpan={5}>
                    <progress className="progress w-full"></progress>
                  </td>
                </tr>
                : null}
              {playbooks ?
                playbooks.length > 0 ?
                  playbooks.filter(playbook => {
                    return array.all([
                      ...dict.keys(inputFilters).map(filter => playbook.inputs.filter(input => input.spec === filter).length > 0),
                      ...dict.keys(outputFilters).map(filter => playbook.outputs.filter(output => output.spec === filter).length > 0),
                      ...dict.keys(dataSourceFilters).map(filter => playbook.dataSources.filter(dataSource => dataSource === filter).length > 0),
                    ])
                  }).map(playbook => (
                    <tr key={playbook.id}>
                      <td><div className="tooltip whitespace-normal z-50" data-tip={playbook.description}>{playbook.label}</div></td>
                      <td>
                        <div className="flex flex-row flex-wrap gap-2 justify-center">
                          {playbook.inputs.map(input => (
                            <button
                              key={input.spec}
                              onClick={() => {
                                setInputFilters(({ [input.spec]: cur, ...filters }) => {
                                  if (!cur) return {...filters, [input.spec]: !cur}
                                  else return filters
                                })
                              }}
                            >
                              <Icon
                                container="circle"
                                container_color={inputFilters[input.spec] ? '#B3CFFF' : '#ddd'}
                                size={1.5}
                                icon={input.meta.icon}
                              />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-row flex-wrap gap-2 justify-center">
                          {playbook.outputs.map(output => (
                            <button
                              key={output.spec}
                              onClick={() => {
                                setOutputFilters(({ [output.spec]: cur, ...filters }) => {
                                  if (!cur) return {...filters, [output.spec]: !cur}
                                  else return filters
                                })
                              }}
                            >
                              <Icon
                                key={output.spec}
                                container="circle"
                                container_color={outputFilters[output.spec] ? '#B3CFFF' : '#ddd'}
                                size={1.5}
                                icon={output.meta.icon}
                              />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-row flex-wrap gap-2 justify-center">
                          {playbook.dataSources.map(dataSource => (
                            <button
                              key={dataSource}
                              onClick={() => {
                                setDataSourceFilters(({ [dataSource]: cur, ...filters }) => {
                                  if (!cur) return {...filters, [dataSource]: !cur}
                                  else return filters
                                })
                              }}
                              className={`underline ${dataSourceFilters[dataSource] ? 'font-bold' : ''}`}
                            >
                              {dataSource}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex flex-row gap-2 justify-center">
                          <Link href={playbook.url}>
                            <button>
                              <Icon icon={view_report_icon} color="black" title="Launch Playbook" />
                            </button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                : <tr>
                  <td colSpan={5}>
                    <div className="alert">No playbooks currently registered</div>
                  </td>
                </tr>
                : null}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  )
}
