export interface CreateTeachingCategoryDto {
  name: string;
}

export interface UpdateTeachingCategoryDto extends Partial<CreateTeachingCategoryDto> {}
