export interface CreateScientificDegreeDto {
  name: string;
}

export interface UpdateScientificDegreeDto extends Partial<CreateScientificDegreeDto> {}
