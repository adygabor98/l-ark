export interface Division {
  id: string;
  name: string;
}

export interface FileTemplate {
  id: string;
  name: string;
  type: string;
}

export interface Step {
  id: string;
  title: string;
  description: string;
  isBlocking: boolean;
  isRequired: boolean;
  fileTemplateIds: string[];
  position: { x: number; y: number };
}

export interface StepEdge {
  id: string;
  source: string;
  target: string;
}

export interface Operation {
  id: string;
  title: string;
  description: string;
  divisionId: string;
  steps: Step[];
  edges: StepEdge[];
  createdAt: string;
  updatedAt: string;
}
