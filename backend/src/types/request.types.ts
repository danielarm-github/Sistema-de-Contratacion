import { RequestStatusEnum } from "@prisma/client";

export interface CreateRequestDto {
  professor_id: number;
  department_id: number;
  document_ids?: number[]; // Array de IDs de documentos existentes
}

export interface UpdateRequestStatusDto {
  status: RequestStatusEnum;
}
