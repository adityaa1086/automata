import { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import { PlusIcon } from '@radix-ui/react-icons';
import {
  TooltipComponent,
  FlowTabsDropdown,
  AvatarComponent,
  NodeDialogComponent,
  Flow,
  FlowCollaborators,
  saveFlow,
} from '@tool-ai/ui';

import { mock } from 'node:test';
import Context from '../../context/context';

interface FlowTabsProps {
  currentUserId: string;
  flowCharts: Flow[];
  reactFlowWrapper: any;
  nodes: Node<{ label: string }, string | undefined>[];
  edges: Edge<any>[];
  onNodesChange: any;
  onEdgesChange: any;
  setNodes: any;
  onConnect: any;
  onInit: any;
  onDrop: any;
  onDragOver: any;
  nodeTypes: any;
  onTabChange: (id: string) => void;
}

const FlowTabs = (props: FlowTabsProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeDialog, setActiveDialog] = useState('');
  const [activeNodeId, setActiveNodeId] = useState('');

  const handleSave = function () {
    saveFlow(props.nodes, props.edges);
  };

  return (
    <Context.Provider
      value={{
        isDialogOpen,
        setIsDialogOpen,
        setActiveDialog,
        setActiveNodeId,
      }}
    >
      <Tabs.Root className="flex flex-col" defaultValue="tab1">
        <Tabs.List
          className="absolute my-2.5 mx-2.5 z-10 bg-white w-50 rounded-md shadow-md
          right-0 flex items-center"
          aria-label="Flow Tabs"
        >
          {props.flowCharts.map((flowChart: Flow) => {
            return (
              <Tabs.Trigger
                className={`tabs-trigger w-52 p-1 text-left flex justify-between items-center border-r-2 border-inherit`}
                value={flowChart.id}
                onClick={() => props.onTabChange(flowChart.id)}
              >
                {flowChart.title}
                <div className="flex gap-x-2 items-center">
                  {flowChart.collaborators.map(
                    (collaborator: FlowCollaborators) => {
                      if (collaborator.id !== props.currentUserId) {
                        return (
                          <AvatarComponent initials={collaborator.initials} />
                        );
                      }
                    }
                  )}
                  <div className="flex gap-x-2 items-center">
                    <FlowTabsDropdown
                      users={flowChart.collaborators}
                      onSave={handleSave}
                    />
                  </div>
                </div>
              </Tabs.Trigger>
            );
          })}

          <TooltipComponent
            text="add new flow"
            buttonContent={<PlusIcon />}
            name="add-flow"
          />
        </Tabs.List>
        {props.flowCharts.map((flowChart: Flow) => {
          return (
            <Tabs.Content value={flowChart.id}>
              {/*The div wrapping a flow must
              have a set height and width*/}
              <div
                className="flex-grow h-screen w-screen realtive z-0"
                ref={props.reactFlowWrapper}
              >
                <ReactFlow
                  nodes={props.nodes}
                  edges={props.edges}
                  onNodesChange={props.onNodesChange}
                  onEdgesChange={props.onEdgesChange}
                  onConnect={props.onConnect}
                  onInit={props.onInit}
                  onDrop={props.onDrop}
                  onDragOver={props.onDragOver}
                  nodeTypes={props.nodeTypes}
                  fitView
                >
                  <Background
                    variant={'dots' as BackgroundVariant}
                    gap={12}
                    size={1}
                  />
                  <Controls position="bottom-right" />
                </ReactFlow>

                {/* <Background variant="dots" gap={12} size={1} /> */}
              </div>
            </Tabs.Content>
          );
        })}
        <NodeDialogComponent
          isOpen={isDialogOpen}
          onClose={setIsDialogOpen}
          activeDialog={activeDialog}
          nodes={props.nodes}
          setNodes={props.setNodes}
          activeNodeId={activeNodeId}
        />
      </Tabs.Root>
    </Context.Provider>
  );
};

export default FlowTabs;
