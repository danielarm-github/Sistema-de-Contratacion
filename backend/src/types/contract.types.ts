import { ContractStatusEnum } from "@prisma/client";

export interface CreateContractDto {
  request_id: number;
}

export interface UpdateContractStatusDto {
  status: ContractStatusEnum;
}
