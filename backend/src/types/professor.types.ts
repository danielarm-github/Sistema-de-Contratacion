export interface CreateProfessorDto {
  name: string;
  ci?: string;
  address?: string;
  phone?: string;
  is_retired: boolean;
  work_center_id: number;
  scientific_degree_id?: number;
  teaching_category_id: number;
}

export interface UpdateProfessorDto extends Partial<CreateProfessorDto> {}
