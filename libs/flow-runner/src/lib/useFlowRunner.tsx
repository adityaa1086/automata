import React, { useEffect, useState } from 'react'
import { Node, Edge } from 'reactflow'
import * as nodeMethods from './nodeMethods'

export interface IFlow {
  nodes: Node[];
  edges: Edge[];
}

interface IRelationships {
  id: string;
  nodeChildren: string[];
}

export interface IFlowRunnerOutputs {
  id: string;
  nodeOutputs:  Record<string, unknown>;
}

export interface IFlowRunnerInputs {
  id: string;
  nodeInputs:  Record<string, unknown>;
}

export interface IFlowRunnerStates {
  id: string;
  state: Record<string, unknown>;
}

export interface IMethodArguments {
  globals?: Record<string, unknown>;
  inputs?: Record<string, unknown>;
  msg: Record<string, unknown>;
}

export interface IExecuteFlowArguments {
  flow: IFlow;
  inputs: IFlowRunnerInputs[];
  globals: Record<string, unknown>;
}

interface IExecuteNodeArguments {
  flow: IFlow;
  relationships: IRelationships[];
  node: Node;
  globals: Record<string, unknown>;
  inputs: IFlowRunnerInputs[];
  msg: Record<string, unknown>;
}

// structuredClone pollyfill for Jest
const structuredClone = (obj: Record<string, unknown>) => {
  return JSON.parse(JSON.stringify(obj))
}

const findNode = (nodes : Node[] | undefined, id: string): Node | undefined => {
  return nodes?.find((node) => node.id === id)
}

const isRootNode = (edges: Edge[] | undefined, nodeId:string): boolean => {
  return !edges?.find((edge) => edge.target === nodeId)
}


export const useFlowRunner = (): {
  // setFlow: ({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => void
  executeFlow: ({flow, inputs, globals} :IExecuteFlowArguments) => Promise<void>
  // setInputs: (inputs: IFlowRunnerInputs[]) => void
  // setGlobals: (globals: Record<string, unknown>) => void
  // globals: Record<string, unknown>
  outputs: IFlowRunnerOutputs[]
  states: IFlowRunnerStates[]
} => {
  // const [flow, setFlow] = useState<IFlow>()
  // const [relationships, setRelationships] = useState<IRelationships[]>([])
  // const [inputs, setInputs] = useState<IFlowRunnerInputs[]>([])
  const [outputs, setOutputs] = useState<IFlowRunnerOutputs[]>([])
  const [states, setStates] = useState<IFlowRunnerStates[]>([])
  // const [globals, setGlobals] = useState<Record<string, unknown>>({})

  // useEffect(() => {
  //   console.log('🌊🪝 Inputs mutated to: ', inputs)
  // }, [inputs])

  // //when nodes or edges change, rebuild the links between parents and children
  // useEffect(() => {
  //     console.log('🌊🪝 Flow mutated to: ', flow);
  //     setRelationships(buildRelationships(flow))
  //   }, [flow])

  const buildRelationships = (flow: IFlow | undefined): IRelationships[] => {
    if (!flow) {
      console.warn(
        `🌊🪝🚨 Cannot build relationships, flow is falsy`
      )
      return []
    }
    
    const relationships:IRelationships[] = []

    flow?.nodes.forEach((node) => {
      relationships.push({
        id: node.id,
        nodeChildren: []
      })
    })    

    flow?.edges?.forEach((edge) => {
      const sourceNode = findNode(flow?.nodes, edge.source)
      const targetNode = findNode(flow?.nodes, edge.target)

      if (sourceNode && targetNode) {
        // add target id to source children
        relationships
          .find((child) => child.id === sourceNode.id)
          ?.nodeChildren.push(targetNode.id)

      } else {
        console.warn(
          `🌊🪝🚨 Invalid Edge. Source node ${edge.source} or target node ${edge.target} not found`
        )
      }
    })
    console.log('🌊🪝 built new relationships\n', relationships);
    return relationships
  }

  /**
   * Execute a node.
   */
  const executeNode = ({
      flow,
      relationships,
      node,
      msg,
      inputs,
      globals,
    } : IExecuteNodeArguments ) => {
    return new Promise((resolve) => {
      console.group('🌊🪝 call to executeNode(...)')
      console.log({flow});
      console.log({nodeChildrenStore: relationships});
      console.log({inputs});
      console.log({outputs});
      console.log({states});
      console.log({globals});
      console.groupEnd()
      // look up the node method
      let method;
      try {
        method = nodeMethods[node.type as keyof typeof nodeMethods]
      } catch (error) {
        console.warn(`🌊🪝🚨 Node type ${node.type} not found`)
      }
      if (method) {
        // set node state to running
        setStates((prevStates) => [
          ...prevStates.filter((state) => state.id !== node.id),
          { id: node.id, state: { status: 'running' } }
        ]);
        // execute the node method 
        console.log(`🌊🪝 executing node ${node.id}`)
        method({
          globals,
          inputs: inputs.find((input) => input.id === node.id)?.nodeInputs || {},
          msg,
        }).then((msg) => {
          // save the output    
          setOutputs((prevOutputs) => [
            ...prevOutputs.filter((output) => output.id !== node.id),
            { id: node.id, nodeOutputs: structuredClone(msg) }
          ]);
          // save the state. If error exists on msg, set state to error, otherwise set it to done
          setStates((prevStates) => [
            ...prevStates.filter((state) => state.id !== node.id),
            { id: node.id, state: { status: 'done' } }
          ]);
          // strip error from msg
          delete msg.error
          //call executeNode on each child
          const childPromises:Promise<unknown>[] = []
          relationships.find((nodeChildren) => nodeChildren.id === node.id)?.nodeChildren.forEach((childId) => {
            const childNode = findNode(flow?.nodes, childId)
            if (childNode) {
              childPromises.push(executeNode({flow, relationships, node:childNode, globals, inputs,msg}))
            } else {
              console.warn(`🌊🪝🚨 Node ${childId} not found`)
            }
          })
          Promise.allSettled(childPromises).then(() => {
            resolve(null)
          })
        })
      } else {
        console.warn(`🌊🪝🚨 Method for node type ${node.type} not found`)
      }
    })
  }

  /**
   * Execute the flow.
   */
  const executeFlow = async ({flow, inputs, globals} :IExecuteFlowArguments) => {
    const relationships = buildRelationships(flow)

    console.group('🌊🪝 call to executeFlow()')
    console.log({flow});
    console.log({nodeChildrenStore: relationships});
    console.log({inputs});
    console.log({outputs});
    console.log({states});
    console.log({globals});
    console.groupEnd()
    
    const rootNodes = flow?.nodes.filter((node) => isRootNode(flow?.edges, node.id))
    // Start the execution by triggering executeNode on each root
    if (rootNodes) {
      const promises = rootNodes.map((rootNode) => executeNode({flow, relationships, node:rootNode, globals, inputs,msg:{}}));
      await Promise.allSettled(promises);
    }
  }

  return {
    // setFlow,
    // setInputs, 
    // setGlobals,
    executeFlow,
    // globals,
    outputs,
    states,
  }
}



