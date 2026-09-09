"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  useViewport,
  ReactFlowProvider,
  type Edge,
  type Node,
} from "@xyflow/react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PersonNode } from "@/components/tree/person-node";
import { UnionNode } from "@/components/tree/union-node";
import { TreeControls } from "@/components/tree/tree-controls";
import { TreeEmptyState } from "@/components/tree/tree-empty-state";
import { generationCount } from "@/lib/relationships";
import { layoutFamilyTree } from "@/lib/tree-layout";
import { ViewOnlyBanner } from "@/components/auth/view-only-banner";
import { useActiveTree, useTreeStore } from "@/store/use-tree-store";
import { useAuthStore, useCanEdit } from "@/store/use-auth-store";
import { PersonProfile } from "@/components/person/person-profile";

const nodeTypes = { person: PersonNode, union: UnionNode };

function TreeCanvas() {
  const people = useTreeStore((s) => s.people);
  const relationships = useTreeStore((s) => s.relationships);
  const selectedPersonId = useTreeStore((s) => s.selectedPersonId);
  const selectPerson = useTreeStore((s) => s.selectPerson);
  const openAddPerson = useTreeStore((s) => s.openAddPerson);
  const generationLimit = useTreeStore((s) => s.generationLimit);
  const setGenerationLimit = useTreeStore((s) => s.setGenerationLimit);
  const profileOpen = useTreeStore((s) => s.profileOpen);
  const tree = useActiveTree();
  const canEdit = useCanEdit();
  const openSignInPrompt = useAuthStore((s) => s.openSignInPrompt);
  const guestView = useAuthStore((s) => s.guestView);
  const { fitView, zoomIn, zoomOut, setCenter } = useReactFlow();
  const { zoom } = useViewport();

  const gens = Math.max(1, generationCount(people));
  const layout = useMemo(
    () => layoutFamilyTree(people, relationships, { maxGeneration: generationLimit }),
    [people, relationships, generationLimit],
  );

  const built = useMemo(() => {
    const nodes: Node[] = [];
    for (const node of layout.nodes) {
      if (node.type === "union") {
        nodes.push({
          id: node.id,
          type: "union",
          position: { x: node.x, y: node.y },
          data: {},
          selectable: false,
          draggable: false,
        });
        continue;
      }
      const person = people.find((p) => p.id === node.personId);
      if (!person) continue;
      nodes.push({
        id: node.id,
        type: "person",
        position: { x: node.x, y: node.y },
        data: {
          person,
          selected: person.id === selectedPersonId,
          onSelect: (id: string) => selectPerson(id),
          canEdit,
          onEdit: (id: string) => {
            if (!canEdit) {
              openSignInPrompt();
              return;
            }
            selectPerson(id);
            useTreeStore.getState().setProfileEditing(true);
          },
          onAddRelative: (id: string) => {
            if (!canEdit) {
              openSignInPrompt();
              return;
            }
            openAddPerson({ anchorId: id });
          },
        },
        selected: person.id === selectedPersonId,
        draggable: false,
      });
    }

    const edges: Edge[] = layout.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type === "spouse" ? "straight" : "smoothstep",
      sourceHandle: edge.type === "spouse" ? "left" : undefined,
      targetHandle: edge.type === "spouse" ? "right" : undefined,
      style: {
        stroke: "#214E34",
        strokeWidth: edge.type === "spouse" ? 1.6 : 1.25,
        opacity: edge.type === "spouse" ? 0.45 : 0.32,
      },
      selectable: false,
    }));

    return { nodes, edges };
  }, [layout, people, selectedPersonId, selectPerson, openAddPerson, canEdit, openSignInPrompt]);

  const [nodes, setNodes, onNodesChange] = useNodesState(built.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(built.edges);

  useEffect(() => {
    setNodes(built.nodes);
    setEdges(built.edges);
  }, [built, setNodes, setEdges]);

  const skipCenter = useRef(true);

  useEffect(() => {
    const t = setTimeout(() => fitView({ padding: 0.18, duration: 500 }), 80);
    return () => clearTimeout(t);
  }, [people.length, generationLimit, fitView]);

  useEffect(() => {
    if (!selectedPersonId) return;
    if (skipCenter.current) {
      skipCenter.current = false;
      return;
    }
    const node = nodes.find((n) => n.id === `person-${selectedPersonId}`);
    if (!node) return;
    setCenter(node.position.x + 94, node.position.y + 80, { zoom: Math.max(zoom, 0.85), duration: 450 });
  }, [selectedPersonId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (people.length === 0) {
    return <TreeEmptyState />;
  }

  return (
    <div className="flex h-full min-h-0">
      <div className="relative h-full min-w-0 flex-1 overscroll-none">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col items-start justify-between gap-3 p-3 sm:flex-row sm:gap-4 sm:p-7">
          <div className="min-w-0">
            <h1 className="truncate font-serif text-2xl tracking-tight text-charcoal sm:text-4xl">
              {tree?.name ?? "Your Family"}
            </h1>
            <p className="mt-0.5 text-xs text-soft sm:mt-1 sm:text-sm">
              {gens} {gens === 1 ? "Generation" : "Generations"} · {people.length}{" "}
              {people.length === 1 ? "Person" : "People"}
            </p>
            {guestView || !canEdit ? (
              <div className="pointer-events-auto mt-2 sm:hidden">
                <ViewOnlyBanner inline />
              </div>
            ) : null}
          </div>
          <div className="pointer-events-auto">
            <TreeControls
              zoom={zoom}
              onZoomIn={() => zoomIn({ duration: 200 })}
              onZoomOut={() => zoomOut({ duration: 200 })}
              onFit={() => fitView({ padding: 0.2, duration: 400 })}
              generations={generationLimit}
              maxGenerations={Math.max(gens, generationLimit)}
              onGenerations={setGenerationLimit}
            />
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          panOnScroll
          zoomOnPinch
          minZoom={0.25}
          maxZoom={1.6}
          proOptions={{ hideAttribution: true }}
          onPaneClick={() => selectPerson(null, false)}
        >
          <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#D7E3D8" />
        </ReactFlow>
        {guestView || !canEdit ? (
          <div className="hidden sm:block">
            <ViewOnlyBanner />
          </div>
        ) : null}
        <div
          className={
            profileOpen && selectedPersonId
              ? "pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] lg:flex"
              : "pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          }
        >
          <div className="pointer-events-auto">
            <Button
              size="lg"
              onClick={() =>
                canEdit
                  ? openAddPerson({ anchorId: selectedPersonId ?? undefined })
                  : openSignInPrompt()
              }
            >
              <Plus className="h-4 w-4" />
              Add Person
            </Button>
          </div>
        </div>
      </div>
      {profileOpen && selectedPersonId ? (
        <div className="hidden h-full w-[360px] shrink-0 lg:block">
          <PersonProfile />
        </div>
      ) : null}
      {profileOpen && selectedPersonId ? (
        <div className="absolute inset-x-0 bottom-0 z-20 lg:hidden">
          <PersonProfile mobile />
        </div>
      ) : null}
    </div>
  );
}

export function FamilyTree() {
  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <TreeCanvas />
      </ReactFlowProvider>
    </div>
  );
}
