export interface CreateUserDto {
  name?: string | null;
  email: string;
  password?: string | null;
  role_id: number;
}

export interface UpdateUserDto extends Partial<CreateUserDto> {}
