import { useState } from 'react'
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
  msg:  Record<string, unknown>;
}

export interface IFlowRunnerInputs {
  id: string;
  nodeInputs:  Record<string, unknown>;
}

export interface IFlowRunnerStates {
  id: string;
  state: Record<string, unknown>;
  inputMsg?: Record<string, unknown>;
  error?: string
}

export interface IMethodArguments<TInputs = Record<string, unknown>> {
  globals?: Record<string, unknown>;
  inputs?: TInputs;
  msg: Record<string, unknown>;
  context?: Record<string, unknown>;
}


export interface IExecuteFlowArguments {
  flow: IFlow;
  inputs: IFlowRunnerInputs[];
  globals: Record<string, unknown>;
  context: Record<string, unknown>;
}

export interface IExecuteBranchArguments {
  flow: IFlow;
  inputs: IFlowRunnerInputs[];
  globals: Record<string, unknown>;
  context: Record<string, unknown>;
  msg: Record<string, unknown>;
  nodeId: string;
}

interface IExecuteNodeArguments {
  flow: IFlow;
  relationships: IRelationships[];
  node: Node;
  globals: Record<string, unknown>;
  inputs: IFlowRunnerInputs[];
  msg: Record<string, unknown>;
  context: Record<string, unknown>;
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
  executeFlow: ({flow, inputs, globals} :IExecuteFlowArguments) => Promise<void>
  executeBranch: ({flow, inputs, globals, msg, nodeId} :IExecuteBranchArguments) => Promise<void>
  outputs: IFlowRunnerOutputs[]
  states: IFlowRunnerStates[]
} => {
  const [outputs, setOutputs] = useState<IFlowRunnerOutputs[]>([])
  const [states, setStates] = useState<IFlowRunnerStates[]>([])

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
    return relationships
  }

  /**
   * Execute a node.
   */
  const executeNode = ({
      flow,
      relationships,
      node,
      msg: inputMsg,
      inputs,
      globals,
      context
    } : IExecuteNodeArguments ) => {
    return new Promise((resolve) => {
      // look up the node method
      let method: ((args: IMethodArguments) => Promise<Record<string, unknown>>) | undefined;
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
          msg: structuredClone(inputMsg),
          context
        }).then((msg) => {
          // save the output    
          setOutputs((prevOutputs) => [
            ...prevOutputs.filter((output) => output.id !== node.id),
            { id: node.id, msg: structuredClone(msg) }
          ]);
          // save the state. If error exists on msg, set state to error, otherwise set it to done
          setStates((prevStates) => [
            ...prevStates.filter((state) => state.id !== node.id),
            { 
              id: node.id,
              state: { status: 'done' },
              inputMsg: structuredClone(inputMsg),
              error: msg.error ? msg.error as string: undefined

            }
          ]);
          //if there was an error, stop this branch of the flow
          if (msg.error) {
            console.warn(`🌊🪝🚨 Error executing node ${node.id}. Stopping Branch`)
            console.warn(msg.error)
            resolve(null)
            return
          }
          //call executeNode on each child
          const childPromises:Promise<unknown>[] = []
          relationships.find((nodeChildren) => nodeChildren.id === node.id)?.nodeChildren.forEach((childId) => {
            const childNode = findNode(flow?.nodes, childId)
            if (childNode) {
              if (childNode.type === 'runner' ) {
                console.log(`🌊🪝 ${childId} is a runner, pausing for manual continue`)
              } else {
                childPromises.push(executeNode({flow, relationships, node:childNode, globals, inputs,msg, context}))
              }
            } else {
              console.warn(`🌊🪝🚨 Node ${childId} not found`)
            }
          })
          Promise.allSettled(childPromises).then(() => {
            resolve(null)
          })
        })
        .catch((error) => {
          console.warn(`🌊🪝🚨 Error executing node ${node.id}. Stopping Branch`)
          console.warn(error)
          setStates((prevStates) => [
            ...prevStates.filter((state) => state.id !== node.id),
            { 
              id: node.id,
              state: { status: 'error', error },
              inputMsg: structuredClone(inputMsg),
              error: error as string
            }
          ]);
          resolve(null)
        })
      } else {
        console.warn(`🌊🪝🚨 Method for node type ${node.type} not found`)
      }
    })
  }

  /**
   * Execute the flow.
   */
  const executeFlow = async ({flow, inputs, globals, context} :IExecuteFlowArguments) => {
    console.log(`🌊🪝 executing flow with inputs:`, {inputs});
    
    const relationships = buildRelationships(flow)
    
    const rootNodes = flow?.nodes.filter((node) => isRootNode(flow?.edges, node.id))
    // Start the execution by triggering executeNode on each root
    if (rootNodes) {
      const promises = rootNodes.map((rootNode) => executeNode({flow, relationships, node:rootNode, globals, inputs,msg:{}, context}));
      await Promise.allSettled(promises);
    }
  }

  const executeBranch = async ({flow, inputs, globals, msg, nodeId, context} :IExecuteBranchArguments) => {
    console.log(`🌊🪝 executing branch from node `, {nodeId});

    const relationships = buildRelationships(flow)

    const node = findNode(flow?.nodes, nodeId)
    if (node) {
      await executeNode({flow, relationships, node, globals, inputs, msg, context})
    }
  }

  return {
    executeFlow,
    executeBranch,
    outputs,
    states,
  }
}