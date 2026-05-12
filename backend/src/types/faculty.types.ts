export interface CreateFacultyDto {
  name: string;
}

export interface UpdateFacultyDto extends Partial<CreateFacultyDto> {}
