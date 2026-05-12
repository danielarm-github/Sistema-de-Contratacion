export interface CreateDepartmentDto {
  name: string;
  faculty_id: number;
}

export interface UpdateDepartmentDto extends Partial<CreateDepartmentDto> {}
