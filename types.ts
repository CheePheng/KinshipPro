
export type RelationType = 
  | 'father' | 'mother' 
  | 'brother_older' | 'brother_younger' 
  | 'sister_older' | 'sister_younger' 
  | 'son' | 'daughter' 
  | 'husband' | 'wife'
  | 'grandfather_paternal' | 'grandmother_paternal'
  | 'grandfather_maternal' | 'grandmother_maternal';

export interface RelationNode {
  label: string;
  type: RelationType;
  color: string;
}

export interface CalculationState {
  path: RelationNode[];
  result: string;
  description: string;
}
