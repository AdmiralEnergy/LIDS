import { useState, useEffect } from "react";
import { Typography, Tag, Badge, Space } from "antd";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { getLeadsByStage, updateLeadStage } from "../providers/mockDataProvider";
import type { Lead } from "@shared/schema";

const { Title, Text } = Typography;

const stageConfig: Record<string, { label: string; color: string }> = {
  new: { label: "New", color: "#1890ff" },
  contacted: { label: "Contacted", color: "#722ed1" },
  qualified: { label: "Qualified", color: "#c9a648" },
  proposal: { label: "Proposal", color: "#13c2c2" },
  won: { label: "Won", color: "#52c41a" },
  lost: { label: "Lost", color: "#ff4d4f" },
};

const getIcpScoreColor = (score: number) => {
  if (score >= 71) return "#c9a648";
  if (score >= 41) return "#faad14";
  return "#ff4d4f";
};

interface LeadCardProps {
  lead: Lead;
  isDragging?: boolean;
}

function LeadCard({ lead, isDragging }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      data-testid={`card-lead-${lead.id}`}
      className={`kanban-card ${isDragging ? "dragging" : ""}`}
    >
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <Text strong style={{ color: "#fff", display: "block", fontSize: 14 }}>
            {lead.name}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
            {lead.company}
          </Text>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Tag
            style={{
              background: getIcpScoreColor(lead.icpScore),
              border: "none",
              borderRadius: 4,
              color: lead.icpScore >= 41 ? "#000" : "#fff",
              fontWeight: 500,
            }}
          >
            ICP: {lead.icpScore}
          </Tag>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>
            {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString() : "N/A"}
          </Text>
        </div>
      </div>
    </div>
  );
}

interface KanbanColumnProps {
  stage: string;
  leads: Lead[];
}

function KanbanColumn({ stage, leads }: KanbanColumnProps) {
  const config = stageConfig[stage];
  
  return (
    <div className="kanban-column" style={{ flex: 1, minWidth: 240 }}>
      <div
        style={{
          padding: "16px 16px 12px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: config.color,
            }}
          />
          <Text strong style={{ color: "#fff", fontSize: 14 }}>
            {config.label}
          </Text>
        </div>
        <Badge
          count={leads.length}
          style={{
            background: "rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.85)",
            boxShadow: "none",
          }}
        />
      </div>
      
      <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </SortableContext>
        
        {leads.length === 0 && (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: 13,
            }}
          >
            No leads in this stage
          </div>
        )}
      </div>
    </div>
  );
}

export function PipelinePage() {
  const [leadsByStage, setLeadsByStage] = useState<Record<string, Lead[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    setLeadsByStage(getLeadsByStage());
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string): string | undefined => {
    for (const [stage, leads] of Object.entries(leadsByStage)) {
      if (leads.some((l) => l.id === id)) {
        return stage;
      }
    }
    return undefined;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeContainer = findContainer(active.id as string);
    const overContainer = findContainer(over.id as string) || (over.id as string);

    if (!activeContainer) return;

    if (activeContainer !== overContainer && Object.keys(stageConfig).includes(overContainer)) {
      const activeLeads = [...leadsByStage[activeContainer]];
      const leadIndex = activeLeads.findIndex((l) => l.id === active.id);
      const [movedLead] = activeLeads.splice(leadIndex, 1);

      const updatedLead = { ...movedLead, stage: overContainer };
      updateLeadStage(movedLead.id, overContainer);

      setLeadsByStage({
        ...leadsByStage,
        [activeContainer]: activeLeads,
        [overContainer]: [...leadsByStage[overContainer], updatedLead],
      });
    }
  };

  const activeLead = activeId
    ? Object.values(leadsByStage)
        .flat()
        .find((l) => l.id === activeId)
    : null;

  const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"];

  return (
    <div style={{ padding: 32, height: "100%", display: "flex", flexDirection: "column" }}>
      <Title level={2} style={{ color: "#fff", marginBottom: 24 }}>
        Pipeline
      </Title>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          style={{
            display: "flex",
            gap: 16,
            flex: 1,
            overflowX: "auto",
            paddingBottom: 16,
          }}
        >
          {stages.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              leads={leadsByStage[stage] || []}
            />
          ))}
        </div>

        <DragOverlay>
          {activeLead ? <LeadCard lead={activeLead} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
