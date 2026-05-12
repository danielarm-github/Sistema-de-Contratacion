import { DocumentStatusEnum } from "@prisma/client";

export interface CreateDocumentDto {
  type: string;
  file_path?: string;
  request_id?: string;
}

export interface UpdateDocumentStatusDto {
  status: DocumentStatusEnum;
}
